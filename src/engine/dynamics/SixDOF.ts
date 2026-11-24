/**
 * 6-Degrees-of-Freedom (6-DOF) Rigid Body Flight Dynamics
 * 
 * Simulates full translational (3 DOF) and rotational (3 DOF) equations of motion:
 * State vector (14 dimensions):
 * - Position r: [x, y, z] in ECI (m)
 * - Velocity v: [vx, vy, vz] in ECI (m/s)
 * - Quaternion q: [qw, qx, qy, qz] (ECI to body frame)
 * - Angular velocity omega: [wx, wy, wz] in Body frame (rad/s)
 * - Current rocket mass m: (kg)
 * 
 * Equations:
 * dr/dt = v
 * dv/dt = (F_thrust + F_aero + F_gravity) / m
 * dq/dt = 0.5 * q * [0, omega]
 * domega/dt = I^(-1) * (Torque_TVC + Torque_Aero - omega x (I * omega))
 * dm/dt = -m_dot
 */

import { Vector3D } from '../math/Vector3D';
import { Quaternion } from '../math/Quaternion';
import { computeISA } from '../atmosphere/ISA';
import { computeAerodynamics } from '../aerodynamics/DragModel';
import { computeGravityVectorJ2, EARTH_OMEGA } from './Gravity';
import { rk4Step } from '../integrator/RungeKutta4';
import { CELESTIAL_BODIES, type CelestialBody } from '../../types/celestial';

export interface SixDOFState {
  time: number;                  // t (s)
  position: Vector3D;            // r in ECI (m)
  velocity: Vector3D;            // v in ECI (m/s)
  attitude: Quaternion;          // q (attitude)
  angularVelocity: Vector3D;     // omega in Body frame (rad/s)
  mass: number;                  // m (kg)
  thrust: number;                // Current thrust magnitude (N)
  drag: number;                  // Current drag magnitude (N)
  dynamicPressure: number;       // q (Pa)
  mach: number;                  // Mach number
  altitude: number;              // Altitude above surface (m)
  downrange: number;             // Downrange distance (m)
}

export interface GuidanceCommand {
  throttle: number;              // 0.0 to 1.0
  gimbalPitchDeg: number;        // Gimbal pitch angle (-degrees to +degrees)
  gimbalYawDeg: number;          // Gimbal yaw angle
  targetPitchDeg?: number;       // Gravity turn target pitch from vertical (0=vertical, 90=horizontal)
}

export interface RocketPhysicalProperties {
  length: number;                // Rocket total length (m)
  diameter: number;              // Rocket diameter (m)
  dryMass: number;               // Dry structural mass (kg)
  referenceArea: number;         // Frontal cross-sectional area (m^2)
  baseCd: number;                // Baseline subsonic Cd (e.g. 0.25)
  centerOfMass: number;          // X_cg from nose (m)
  centerOfPressure: number;      // X_cp from nose (m)
  momentOfInertiaPitch: number;  // I_yy / I_zz (kg*m^2)
  momentOfInertiaRoll: number;   // I_xx (kg*m^2)
}

/**
 * Packs 6-DOF state into a flat array of 14 numbers for numerical ODE integrators.
 */
export function packState(
  pos: Vector3D,
  vel: Vector3D,
  att: Quaternion,
  omega: Vector3D,
  mass: number
): number[] {
  return [
    pos.x, pos.y, pos.z,
    vel.x, vel.y, vel.z,
    att.w, att.x, att.y, att.z,
    omega.x, omega.y, omega.z,
    mass
  ];
}

/**
 * Unpacks array of 14 numbers back into vector and quaternion state representations.
 */
export function unpackState(arr: number[]): {
  pos: Vector3D;
  vel: Vector3D;
  att: Quaternion;
  omega: Vector3D;
  mass: number;
} {
  return {
    pos: new Vector3D(arr[0], arr[1], arr[2]),
    vel: new Vector3D(arr[3], arr[4], arr[5]),
    att: new Quaternion(arr[6], arr[7], arr[8], arr[9]).normalize(),
    omega: new Vector3D(arr[10], arr[11], arr[12]),
    mass: arr[13]
  };
}

/**
 * Evaluates the 14-dimension state derivative vector for 6-DOF rocket flight.
 */
export function compute6DOFDerivative(
  t: number,
  stateArr: number[],
  rocket: RocketPhysicalProperties,
  thrustVacuum: number,
  massFlowRate: number,
  guidance: GuidanceCommand,
  body: CelestialBody = 'earth'
): {
  derivative: number[];
  thrust: number;
  drag: number;
  dynamicPressure: number;
  mach: number;
  altitude: number;
} {
  const { pos, vel, att, omega, mass } = unpackState(stateArr);
  const data = CELESTIAL_BODIES[body];
  const R_body = data.radius;

  const rMag = pos.magnitude();
  const altitude = Math.max(0, rMag - R_body);

  // 1. Atmosphere & Aerodynamics
  let Pa = 0;
  let rho = 0;
  let speedOfSound = 340;
  let ambientTemp = 288.15;

  if (data.hasAtmosphere && altitude < 120_000) {
    const atmo = computeISA(altitude);
    Pa = atmo.pressure;
    rho = atmo.density;
    speedOfSound = atmo.speedOfSound;
    ambientTemp = atmo.temperature;
  }

  // Airspeed relative to rotating Earth atmosphere
  // V_rel = V_inertial - (omega_earth x r)
  const vAtmo = new Vector3D(-EARTH_OMEGA * pos.y, EARTH_OMEGA * pos.x, 0);
  const vRel = vel.subtract(vAtmo);
  const vAirspeed = vRel.magnitude();

  const aero = computeAerodynamics(
    vAirspeed,
    rho,
    speedOfSound,
    ambientTemp,
    rocket.referenceArea,
    rocket.baseCd
  );

  // Aerodynamic drag force points directly opposite relative airspeed vector
  let fDrag = new Vector3D(0, 0, 0);
  if (vAirspeed > 1e-3) {
    fDrag = vRel.normalize().scale(-aero.dragForce);
  }

  // 2. Thrust vector in body frame with TVC gimbal
  const rad = Math.PI / 180.0;
  const gimbalPitch = (guidance.gimbalPitchDeg || 0) * rad;
  const gimbalYaw = (guidance.gimbalYawDeg || 0) * rad;

  // Single engine exit area approximation: A_e ~ 0.5 * Area
  const exitArea = 0.3 * rocket.referenceArea;
  const netThrustScalar = Math.max(0, thrustVacuum - Pa * exitArea) * (guidance.throttle || 1.0);

  // Active guidance: align attitude with local gravity turn profile if targetPitchDeg is specified
  let effectiveAtt = att;
  if (guidance.targetPitchDeg !== undefined && rMag > 1000) {
    const pitchRad = guidance.targetPitchDeg * rad;
    const up = pos.normalize();
    // Eastward local horizontal vector
    const east = new Vector3D(0, 0, 1).cross(up);
    const eastNorm = east.magnitude() > 1e-6 ? east.normalize() : new Vector3D(0, 1, 0);
    // Target thrust vector direction
    const targetDir = up.scale(Math.cos(pitchRad)).add(eastNorm.scale(Math.sin(pitchRad))).normalize();

    // Rotate unit vector (1, 0, 0) into targetDir via quaternion
    const v1 = new Vector3D(1, 0, 0);
    const v2 = targetDir;
    const dot = v1.dot(v2);
    if (dot > 0.99999) {
      effectiveAtt = Quaternion.identity();
    } else if (dot < -0.99999) {
      effectiveAtt = Quaternion.fromAxisAngle(new Vector3D(0, 0, 1), Math.PI);
    } else {
      const cross = v1.cross(v2);
      const w = 1.0 + dot;
      effectiveAtt = new Quaternion(w, cross.x, cross.y, cross.z).normalize();
    }
  }

  // Thrust vector in body coordinates (+X is rocket longitudinal nose direction)
  const thrustBody = new Vector3D(
    Math.cos(gimbalPitch) * Math.cos(gimbalYaw),
    Math.sin(gimbalPitch),
    Math.sin(gimbalYaw)
  ).scale(netThrustScalar);

  // Rotate thrust into inertial ECI frame
  const fThrustECI = effectiveAtt.rotateVector(thrustBody);

  // 3. Gravitational force
  const [gx, gy, gz] = computeGravityVectorJ2(pos.x, pos.y, pos.z);
  const fGrav = new Vector3D(gx * mass, gy * mass, gz * mass);

  // 4. Translational acceleration: a = F_total / m
  const fTotal = fThrustECI.add(fDrag).add(fGrav);
  const accel = fTotal.scale(1.0 / Math.max(1.0, mass));

  // 5. Attitude derivative: dq/dt = 0.5 * q * [0, omega]
  const dq = att.derivative(omega);

  // 6. Rotational dynamics & torques
  // TVC gimbal torque: tau = r_gimbal x F_thrust
  // Gimbal is located at rocket base: distance from CoM = (length - X_cg)
  const gimbalArm = -(rocket.length - rocket.centerOfMass);
  const tauTVC_y = -gimbalArm * thrustBody.y; // Pitch torque
  const tauTVC_z = -gimbalArm * thrustBody.z; // Yaw torque

  // Aerodynamic restoring torque: tau = (X_cp - X_cg) x F_lift_normal
  // Restores rocket toward relative wind vector if CoP is behind CoM
  const stabilityArm = rocket.centerOfPressure - rocket.centerOfMass;
  const alphaPitch = Math.atan2(vRel.y, Math.max(1.0, vRel.x));
  const tauAero_y = -0.5 * rho * vAirspeed * vAirspeed * rocket.referenceArea * stabilityArm * alphaPitch * 2.0;

  const totalTorqueY = tauTVC_y + tauAero_y;
  const totalTorqueZ = tauTVC_z;

  const I_pitch = Math.max(100, rocket.momentOfInertiaPitch);
  const I_roll = Math.max(50, rocket.momentOfInertiaRoll);

  // Euler rotational equations of motion: domega/dt = I^-1 * (Torque - omega x (I * omega))
  const dOmegaX = 0; // Roll damped
  const dOmegaY = totalTorqueY / I_pitch;
  const dOmegaZ = totalTorqueZ / I_pitch;

  // 7. Mass depletion rate
  const dm = -massFlowRate * (guidance.throttle || 1.0);

  const derivative = [
    vel.x, vel.y, vel.z,
    accel.x, accel.y, accel.z,
    dq[0], dq[1], dq[2], dq[3],
    dOmegaX, dOmegaY, dOmegaZ,
    dm
  ];

  return {
    derivative,
    thrust: netThrustScalar,
    drag: aero.dragForce,
    dynamicPressure: aero.dynamicPressure,
    mach: aero.mach,
    altitude
  };
}

/**
 * Propagates 6-DOF state forward by time step dt.
 */
export function step6DOF(
  state: SixDOFState,
  rocket: RocketPhysicalProperties,
  thrustVacuum: number,
  massFlowRate: number,
  guidance: GuidanceCommand,
  dt: number,
  body: CelestialBody = 'earth'
): SixDOFState {
  const currentPacked = packState(
    state.position,
    state.velocity,
    state.attitude,
    state.angularVelocity,
    state.mass
  );

  let lastEval: ReturnType<typeof compute6DOFDerivative> | null = null;

  const f = (t: number, y: number[]) => {
    const res = compute6DOFDerivative(t, y, rocket, thrustVacuum, massFlowRate, guidance, body);
    lastEval = res;
    return res.derivative;
  };

  const nextPacked = rk4Step(state.time, currentPacked, dt, f);
  const unpacked = unpackState(nextPacked);

  // If guidance commanded an attitude alignment, maintain it in unpacked state
  if (lastEval && guidance.targetPitchDeg !== undefined) {
    const pitchRad = (guidance.targetPitchDeg || 0) * (Math.PI / 180.0);
    const up = unpacked.pos.normalize();
    const east = new Vector3D(0, 0, 1).cross(up);
    const eastNorm = east.magnitude() > 1e-6 ? east.normalize() : new Vector3D(0, 1, 0);
    const targetDir = up.scale(Math.cos(pitchRad)).add(eastNorm.scale(Math.sin(pitchRad))).normalize();

    const v1 = new Vector3D(1, 0, 0);
    const dot = v1.dot(targetDir);
    if (dot > 0.99999) {
      unpacked.att = Quaternion.identity();
    } else if (dot < -0.99999) {
      unpacked.att = Quaternion.fromAxisAngle(new Vector3D(0, 0, 1), Math.PI);
    } else {
      const cross = v1.cross(targetDir);
      unpacked.att = new Quaternion(1.0 + dot, cross.x, cross.y, cross.z).normalize();
    }
  }

  // Prevent mass from going below dry mass
  unpacked.mass = Math.max(rocket.dryMass, unpacked.mass);

  const altitude = Math.max(0, unpacked.pos.magnitude() - CELESTIAL_BODIES[body].radius);
  const downrange = state.downrange + unpacked.vel.magnitude() * dt * Math.cos(state.attitude.toEulerDegrees().pitch * (Math.PI / 180.0));

  return {
    time: state.time + dt,
    position: unpacked.pos,
    velocity: unpacked.vel,
    attitude: unpacked.att,
    angularVelocity: unpacked.omega,
    mass: unpacked.mass,
    thrust: lastEval?.thrust || 0,
    drag: lastEval?.drag || 0,
    dynamicPressure: lastEval?.dynamicPressure || 0,
    mach: lastEval?.mach || 0,
    altitude,
    downrange
  };
}
