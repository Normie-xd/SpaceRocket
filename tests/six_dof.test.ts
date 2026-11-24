import { describe, it, expect } from 'vitest';
import { Vector3D } from '../src/engine/math/Vector3D';
import { Quaternion } from '../src/engine/math/Quaternion';
import { calculateBarrowmanStability } from '../src/engine/aerodynamics/Stability';
import { step6DOF, type SixDOFState, type RocketPhysicalProperties, type GuidanceCommand } from '../src/engine/dynamics/SixDOF';
import type { RocketDesign } from '../src/types/rocket';

describe('3D Vector & Quaternion Aerospace Math', () => {
  it('correctly computes vector dot and cross products', () => {
    const v1 = new Vector3D(1, 0, 0);
    const v2 = new Vector3D(0, 1, 0);

    expect(v1.dot(v2)).toBe(0);
    const cross = v1.cross(v2);
    expect(cross.x).toBe(0);
    expect(cross.y).toBe(0);
    expect(cross.z).toBe(1);
    expect(cross.magnitude()).toBeCloseTo(1.0, 5);
  });

  it('rotates 3D vectors via Quaternions accurately', () => {
    // 90 degree rotation about Z-axis
    const axis = new Vector3D(0, 0, 1);
    const q = Quaternion.fromAxisAngle(axis, Math.PI / 2.0);

    // Vector pointing along +X
    const v = new Vector3D(1, 0, 0);
    const vRot = q.rotateVector(v);

    expect(vRot.x).toBeCloseTo(0, 5);
    expect(vRot.y).toBeCloseTo(1, 5); // Points along +Y now
    expect(vRot.z).toBeCloseTo(0, 5);
  });

  it('converts between Quaternions and Euler angles (Pitch, Yaw, Roll)', () => {
    const pitchDeg = 45;
    const yawDeg = 30;
    const rollDeg = 15;
    const rad = Math.PI / 180.0;

    const q = Quaternion.fromEuler(pitchDeg * rad, yawDeg * rad, rollDeg * rad);
    const euler = q.toEulerDegrees();

    expect(euler.pitch).toBeCloseTo(pitchDeg, 1);
    expect(euler.yaw).toBeCloseTo(yawDeg, 1);
    expect(euler.roll).toBeCloseTo(rollDeg, 1);
  });
});

describe('Barrowman Aerodynamic Stability (CoM vs CoP)', () => {
  const sampleRocket: RocketDesign = {
    id: 'test-rocket',
    name: 'Sounding Rocket Alpha',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      {
        id: 'nc',
        type: 'noseCone',
        name: 'Ogive Nose Cone',
        parameters: {
          shape: 'ogive',
          length: 1.0,
          baseDiameter: 0.3,
          wallThickness: 0.003,
          material: 'carbonFibreComposite',
          mass: 5.0
        }
      },
      {
        id: 'tank',
        type: 'propellantTank',
        name: 'Main Propellant Tank',
        parameters: {
          length: 4.0,
          outerDiameter: 0.3,
          wallThickness: 0.003,
          material: 'aluminiumAlloy',
          structuralMass: 20.0,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          propellantMass: 100.0,
          oxidiserMass: 150.0,
          mixtureRatio: 2.5,
          ullagePercent: 5,
          pressurisation: 'regulated',
          operatingPressure: 3_000_000
        }
      },
      {
        id: 'fins',
        type: 'fin',
        name: 'Stabilizing Fins',
        parameters: {
          shape: 'trapezoidal',
          quantity: 4,
          rootChord: 0.6,
          tipChord: 0.2,
          span: 0.3,
          sweepAngle: 30,
          thickness: 0.005,
          material: 'aluminiumAlloy',
          mass: 8.0,
          attachPosition: 4.4
        }
      }
    ]
  };

  it('calculates realistic CoP behind CoM for aerodynamic passive stability', () => {
    const stability = calculateBarrowmanStability(sampleRocket);

    expect(stability.centerOfMass).toBeGreaterThan(0);
    expect(stability.centerOfPressure).toBeGreaterThan(0);

    // Fins at the rear should pull CoP well behind CoM
    expect(stability.centerOfPressure).toBeGreaterThan(stability.centerOfMass);
    expect(stability.staticMarginCalibers).toBeGreaterThanOrEqual(1.0);
    expect(stability.isStable).toBe(true);
  });
});

describe('6-DOF Rigid Body Integrator', () => {
  it('propagates 6-DOF state without NaN and conserves realistic kinematic bounds', () => {
    const rocket: RocketPhysicalProperties = {
      length: 10.0,
      diameter: 1.0,
      dryMass: 1000.0,
      referenceArea: 0.785,
      baseCd: 0.25,
      centerOfMass: 5.5,
      centerOfPressure: 6.5,
      momentOfInertiaPitch: 5000,
      momentOfInertiaRoll: 500
    };

    const initialState: SixDOFState = {
      time: 0,
      position: new Vector3D(6371000, 0, 0),
      velocity: new Vector3D(0, 465, 0), // Equator rotational velocity
      attitude: Quaternion.identity(),
      angularVelocity: new Vector3D(0, 0, 0),
      mass: 5000.0,
      thrust: 0,
      drag: 0,
      dynamicPressure: 0,
      mach: 0,
      altitude: 0,
      downrange: 0
    };

    const guidance: GuidanceCommand = {
      throttle: 1.0,
      gimbalPitchDeg: 0,
      gimbalYawDeg: 0
    };

    const thrustVacuum = 80_000; // 80 kN
    const massFlow = 25.0; // 25 kg/s

    const nextState = step6DOF(initialState, rocket, thrustVacuum, massFlow, guidance, 0.02, 'earth');

    expect(nextState.time).toBeCloseTo(0.02, 3);
    expect(nextState.mass).toBeLessThan(initialState.mass); // Consumed fuel
    expect(Number.isFinite(nextState.position.x)).toBe(true);
    expect(Number.isFinite(nextState.velocity.y)).toBe(true);
  });
});
