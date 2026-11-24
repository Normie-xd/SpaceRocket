/**
 * US Standard Atmosphere 1976 (ISA)
 * 
 * Computes atmospheric properties from sea level up to 86 km (mesopause):
 * - Geopotential altitude (H)
 * - Temperature (T)
 * - Atmospheric pressure (P)
 * - Atmospheric density (rho)
 * - Speed of sound (a)
 * - Dynamic viscosity (mu) via Sutherland's law
 */

// Universal & Physical Constants
export const G0 = 9.80665;             // Standard gravitational acceleration (m/s^2)
export const R_EARTH = 6356766.0;       // Earth nominal radius for geopotential conversion (m)
export const R_STAR = 8314.32;          // Universal gas constant (N*m / (kmol*K))
export const M_AIR = 28.9644;           // Mean molecular weight of air (kg/kmol)
export const R_AIR = R_STAR / M_AIR;    // Specific gas constant for dry air ~ 287.05287 J/(kg*K)
export const GAMMA_AIR = 1.4;           // Ratio of specific heats for diatomic gas

// Sutherland's law constants for air dynamic viscosity
const SUTHERLAND_S = 110.4;             // Sutherland temperature constant (K)
const SUTHERLAND_BETA = 1.458e-6;       // Sutherland coefficient (kg / (m*s*K^0.5))

export interface AtmosphereLayer {
  hBase: number;   // Base geopotential altitude (m)
  tempBase: number;// Base temperature (K)
  lapseRate: number;// Temperature lapse rate (K/m)
  pBase: number;   // Base pressure (Pa)
}

// 1976 Standard Atmosphere Table (0 to 86,000 geopotential meters)
export const ISA_LAYERS: AtmosphereLayer[] = [
  { hBase: 0,      tempBase: 288.15, lapseRate: -0.0065, pBase: 101325.0 },     // Troposphere
  { hBase: 11000,  tempBase: 216.65, lapseRate: 0.0,     pBase: 22632.06 },     // Tropopause
  { hBase: 20000,  tempBase: 216.65, lapseRate: 0.0010,  pBase: 5474.889 },     // Stratosphere 1
  { hBase: 32000,  tempBase: 228.65, lapseRate: 0.0028,  pBase: 868.0187 },     // Stratosphere 2
  { hBase: 47000,  tempBase: 270.65, lapseRate: 0.0,     pBase: 110.9063 },     // Stratopause
  { hBase: 51000,  tempBase: 270.65, lapseRate: -0.0028, pBase: 66.93887 },     // Mesosphere 1
  { hBase: 71000,  tempBase: 214.65, lapseRate: -0.0020, pBase: 3.956420 },     // Mesosphere 2
  { hBase: 84852,  tempBase: 186.946,lapseRate: 0.0,     pBase: 0.3733836 }     // Mesopause
];

export interface AtmosphericState {
  geometricAltitude: number; // Geometric altitude h (m)
  geopotentialAltitude: number; // Geopotential altitude H (m)
  temperature: number;       // Temperature T (K)
  pressure: number;          // Pressure P (Pa)
  density: number;           // Density rho (kg/m^3)
  speedOfSound: number;      // Speed of sound a (m/s)
  dynamicViscosity: number;  // Dynamic viscosity mu (Pa*s)
}

/**
 * Converts geometric altitude (height above sea level) to geopotential altitude.
 * H = (R_EARTH * h) / (R_EARTH + h)
 */
export function geometricToGeopotential(geometricAlt: number): number {
  if (geometricAlt <= 0) return 0;
  return (R_EARTH * geometricAlt) / (R_EARTH + geometricAlt);
}

/**
 * Converts geopotential altitude to geometric altitude.
 * h = (R_EARTH * H) / (R_EARTH - H)
 */
export function geopotentialToGeometric(geopotentialAlt: number): number {
  if (geopotentialAlt <= 0) return 0;
  if (geopotentialAlt >= R_EARTH) return Infinity;
  return (R_EARTH * geopotentialAlt) / (R_EARTH - geopotentialAlt);
}

/**
 * Computes the 1976 US Standard Atmosphere properties for a given geometric altitude.
 * Valid from sea level to 86,000+ meters. Above 86 km, smoothly transitions to vacuum approximation.
 * 
 * @param geometricAltitude Altitude in meters above mean sea level
 */
export function computeISA(geometricAltitude: number): AtmosphericState {
  const h = Math.max(0, geometricAltitude);
  const H = geometricToGeopotential(h);

  // Above 86 km (upper atmosphere / exobase transition)
  if (H >= 84852) {
    const H_top = 84852;
    const topLayer = ISA_LAYERS[ISA_LAYERS.length - 1];
    const T = topLayer.tempBase;
    // Exponential scale height falloff above 85 km
    const scaleHeight = (R_AIR * T) / G0; // ~5.4 km
    const deltaH = H - H_top;
    const P = topLayer.pBase * Math.exp(-deltaH / scaleHeight);
    const density = P / (R_AIR * T);
    const speedOfSound = Math.sqrt(GAMMA_AIR * R_AIR * T);
    const dynamicViscosity = (SUTHERLAND_BETA * Math.pow(T, 1.5)) / (T + SUTHERLAND_S);

    return {
      geometricAltitude: h,
      geopotentialAltitude: H,
      temperature: T,
      pressure: Math.max(0, P),
      density: Math.max(0, density),
      speedOfSound,
      dynamicViscosity
    };
  }

  // Find corresponding atmosphere layer
  let layerIndex = 0;
  for (let i = ISA_LAYERS.length - 1; i >= 0; i--) {
    if (H >= ISA_LAYERS[i].hBase) {
      layerIndex = i;
      break;
    }
  }

  const layer = ISA_LAYERS[layerIndex];
  const deltaH = H - layer.hBase;
  let T: number;
  let P: number;

  if (Math.abs(layer.lapseRate) < 1e-10) {
    // Isothermal layer
    T = layer.tempBase;
    const exponent = (-G0 * deltaH) / (R_AIR * T);
    P = layer.pBase * Math.exp(exponent);
  } else {
    // Gradient layer (non-zero lapse rate)
    T = layer.tempBase + layer.lapseRate * deltaH;
    const exponent = -G0 / (layer.lapseRate * R_AIR);
    P = layer.pBase * Math.pow(T / layer.tempBase, exponent);
  }

  // Equation of state for ideal gas: rho = P / (R_spec * T)
  const density = P / (R_AIR * T);

  // Speed of sound: a = sqrt(gamma * R_spec * T)
  const speedOfSound = Math.sqrt(GAMMA_AIR * R_AIR * T);

  // Sutherland's law for dynamic viscosity
  const dynamicViscosity = (SUTHERLAND_BETA * Math.pow(T, 1.5)) / (T + SUTHERLAND_S);

  return {
    geometricAltitude: h,
    geopotentialAltitude: H,
    temperature: T,
    pressure: P,
    density,
    speedOfSound,
    dynamicViscosity
  };
}
