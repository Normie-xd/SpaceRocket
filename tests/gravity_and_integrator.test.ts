import { describe, it, expect } from 'vitest';
import {
  computeGravity,
  computeCircularOrbitVelocity,
  computeEscapeVelocity,
  computeSurfaceRotationalSpeed,
  computeGravityVectorJ2
} from '../src/engine/dynamics/Gravity';
import { rk4Step } from '../src/engine/integrator/RungeKutta4';

describe('Celestial Gravity & Orbital Dynamics', () => {
  it('matches standard Earth surface gravity and decreases with altitude', () => {
    const gSeaLevel = computeGravity(0, 'earth');
    // At mean volumetric radius (6,371 km), surface gravity is ~9.82 m/s^2
    expect(gSeaLevel).toBeCloseTo(9.82, 1);

    // At ISS altitude (~400 km)
    const gISS = computeGravity(400_000, 'earth');
    expect(gISS).toBeCloseTo(8.68, 1); // ~8.68 m/s^2 (still ~89% of surface gravity!)
    expect(gISS).toBeLessThan(gSeaLevel);
  });

  it('calculates correct circular and escape velocities for Low Earth Orbit', () => {
    // At 300 km LEO: v_circ ~ 7.73 km/s
    const vCirc300km = computeCircularOrbitVelocity(300_000, 'earth');
    expect(vCirc300km).toBeCloseTo(7725, -1);

    // Escape velocity from surface ~ 11.18 km/s
    const vEscSurface = computeEscapeVelocity(0, 'earth');
    expect(vEscSurface).toBeCloseTo(11186, -1);

    // Escape velocity is always sqrt(2) * circular velocity
    expect(vEscSurface / computeCircularOrbitVelocity(0, 'earth')).toBeCloseTo(Math.SQRT2, 4);
  });

  it('calculates Earth rotational velocity assist (e.g. at Kennedy Space Center)', () => {
    // KSC latitude is ~28.6 degrees
    const vAssistKSC = computeSurfaceRotationalSpeed(28.6);
    // KSC gives ~408 m/s free eastward velocity assist!
    expect(vAssistKSC).toBeCloseTo(408, 0);

    // Equator (0 deg) gives maximum ~465 m/s
    const vEquator = computeSurfaceRotationalSpeed(0);
    expect(vEquator).toBeCloseTo(465, 0);

    // Poles (90 deg) give 0 m/s
    const vPole = computeSurfaceRotationalSpeed(90);
    expect(vPole).toBeCloseTo(0, 1);
  });

  it('computes J2 oblateness gravity vector symmetrically', () => {
    const r = 7_000_000; // 7,000 km
    const [ax, ay, az] = computeGravityVectorJ2(r, 0, 0);

    // Radial acceleration pointing toward center
    expect(ax).toBeLessThan(0);
    expect(ay).toBeCloseTo(0, 5);
    expect(az).toBeCloseTo(0, 5);
  });
});

describe('Classical Runge-Kutta 4th Order (RK4) Integrator', () => {
  it('accurately integrates simple harmonic oscillator: d2x/dt2 = -omega^2 * x', () => {
    // y = [x, v]
    // dx/dt = v
    // dv/dt = -omega^2 * x
    const omega = 1.0;
    const f = (_t: number, [x, v]: number[]) => [v, -omega * omega * x];

    let t = 0;
    let y = [1.0, 0.0]; // x(0) = 1, v(0) = 0 -> exact solution: x(t) = cos(t)
    const dt = 0.05;
    const targetTime = Math.PI; // at t = pi, x(pi) = -1.0, v(pi) = 0.0

    while (t < targetTime - 1e-6) {
      const step = Math.min(dt, targetTime - t);
      y = rk4Step(t, y, step, f);
      t += step;
    }

    expect(y[0]).toBeCloseTo(-1.0, 4); // Extremely high accuracy of RK4
    expect(y[1]).toBeCloseTo(0.0, 4);
  });

  it('accurately integrates projectile free fall under gravity', () => {
    // Free fall under constant g = 9.81 m/s^2 from h0 = 1000m, v0 = 0m/s
    // Analytical: h(t) = h0 - 0.5 * g * t^2, v(t) = -g * t
    const g = 9.80665;
    const f = (_t: number, [_h, v]: number[]) => [v, -g];

    let t = 0;
    let y = [1000.0, 0.0];
    const dt = 0.1;
    const simTime = 10.0; // 10 seconds

    while (t < simTime - 1e-6) {
      y = rk4Step(t, y, dt, f);
      t += dt;
    }

    const expectedH = 1000.0 - 0.5 * g * 10 * 10;
    const expectedV = -g * 10;

    expect(y[0]).toBeCloseTo(expectedH, 5);
    expect(y[1]).toBeCloseTo(expectedV, 5);
  });
});
