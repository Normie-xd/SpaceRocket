/**
 * Classical 4th-Order Runge-Kutta (RK4) Numerical ODE Integrator
 * 
 * Solves the initial value problem:
 * dy/dt = f(t, y)
 * 
 * Provides fourth-order global error O(dt^4), which is the aerospace
 * standard for real-time trajectory simulation and orbital propagation.
 */

export type DerivativeFunction = (t: number, y: number[]) => number[];

/**
 * Steps a state vector y forward by time dt using Runge-Kutta 4th Order.
 * 
 * @param t Current simulation time (s)
 * @param y Current state vector
 * @param dt Time step size (s)
 * @param f Derivative function f(t, y) returning dy/dt
 * @returns Next state vector y_{n+1} at time t + dt
 */
export function rk4Step(
  t: number,
  y: number[],
  dt: number,
  f: DerivativeFunction
): number[] {
  const n = y.length;
  const halfDt = dt * 0.5;

  // k1 = f(t, y)
  const k1 = f(t, y);

  // k2 = f(t + dt/2, y + dt/2 * k1)
  const yTemp = new Array(n);
  for (let i = 0; i < n; i++) {
    yTemp[i] = y[i] + halfDt * k1[i];
  }
  const k2 = f(t + halfDt, yTemp);

  // k3 = f(t + dt/2, y + dt/2 * k2)
  for (let i = 0; i < n; i++) {
    yTemp[i] = y[i] + halfDt * k2[i];
  }
  const k3 = f(t + halfDt, yTemp);

  // k4 = f(t + dt, y + dt * k3)
  for (let i = 0; i < n; i++) {
    yTemp[i] = y[i] + dt * k3[i];
  }
  const k4 = f(t + dt, yTemp);

  // y_{n+1} = y + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
  const dt6 = dt / 6.0;
  const yNext = new Array(n);
  for (let i = 0; i < n; i++) {
    yNext[i] = y[i] + dt6 * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
  }

  return yNext;
}

/**
 * 1D Flight Dynamics State Vector for rapid 1D vertical tests:
 * State: [altitude (m), velocity (m/s), mass (kg)]
 */
export interface Vertical1DFlightState {
  time: number;
  altitude: number;
  velocity: number;
  mass: number;
}
