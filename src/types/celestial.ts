// ─── Celestial Body Types ─────────────────────────────────────────────────────

export type CelestialBody =
  | 'earth'
  | 'moon'
  | 'mars'
  | 'venus'
  | 'titan'       // Saturn's moon — has dense N2 atmosphere, interesting for simulation
  | 'mercury'
  | 'jupiter'     // upper atmosphere only
  | 'europa'
  | 'ganymede'
  | 'enceladus'

/**
 * Physical and atmospheric constants for a celestial body.
 * All values in SI units.
 */
export interface CelestialBodyData {
  id: CelestialBody
  name: string
  radius: number                   // m (mean equatorial)
  mass: number                     // kg
  mu: number                       // m³/s² (gravitational parameter)
  surfaceGravity: number           // m/s² (surface)
  rotationPeriod: number           // s (sidereal)
  axialTilt: number                // degrees
  hasAtmosphere: boolean
  atmosphere: AtmosphereModel | null
  surfaceType: 'solid' | 'liquid' | 'gaseous' | 'icy'
  color: string                    // hex — for rendering
}

export interface AtmosphereModel {
  surfacePressure: number          // Pa
  surfaceDensity: number           // kg/m³
  surfaceTemperature: number       // K
  scaleHeight: number              // m — pressure e-folding height
  composition: AtmosphericGas[]
  model: 'ISA' | 'exponential' | 'NRLMSISE00' | 'custom'
  karmanLine: number               // m — conventional space boundary
}

export interface AtmosphericGas {
  formula: string
  massFraction: number             // 0–1
  moleMass: number                 // g/mol
}

// ─── Celestial Body Database (constants) ──────────────────────────────────────
export const CELESTIAL_BODIES: Record<CelestialBody, CelestialBodyData> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    radius: 6_371_000,
    mass: 5.972e24,
    mu: 3.986004418e14,
    surfaceGravity: 9.80665,
    rotationPeriod: 86164.1,       // sidereal day (s)
    axialTilt: 23.44,
    hasAtmosphere: true,
    atmosphere: {
      surfacePressure: 101_325,
      surfaceDensity: 1.225,
      surfaceTemperature: 288.15,
      scaleHeight: 8500,
      composition: [
        { formula: 'N2', massFraction: 0.7553, moleMass: 28.014 },
        { formula: 'O2', massFraction: 0.2314, moleMass: 31.999 },
        { formula: 'Ar', massFraction: 0.0128, moleMass: 39.948 },
        { formula: 'CO2', massFraction: 0.0006, moleMass: 44.01 }
      ],
      model: 'ISA',
      karmanLine: 100_000
    },
    surfaceType: 'solid',
    color: '#1a6fa8'
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    radius: 1_737_400,
    mass: 7.342e22,
    mu: 4.9048695e12,
    surfaceGravity: 1.62,
    rotationPeriod: 2_360_591.5,
    axialTilt: 1.54,
    hasAtmosphere: false,
    atmosphere: null,
    surfaceType: 'solid',
    color: '#888888'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    radius: 3_389_500,
    mass: 6.3910e23,
    mu: 4.282837e13,
    surfaceGravity: 3.72076,
    rotationPeriod: 88_642.66,
    axialTilt: 25.19,
    hasAtmosphere: true,
    atmosphere: {
      surfacePressure: 636,
      surfaceDensity: 0.020,
      surfaceTemperature: 210,
      scaleHeight: 11_100,
      composition: [
        { formula: 'CO2', massFraction: 0.953, moleMass: 44.01 },
        { formula: 'N2', massFraction: 0.027, moleMass: 28.014 },
        { formula: 'Ar', massFraction: 0.016, moleMass: 39.948 }
      ],
      model: 'exponential',
      karmanLine: 80_000
    },
    surfaceType: 'solid',
    color: '#c1440e'
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    radius: 6_051_800,
    mass: 4.8675e24,
    mu: 3.24859e14,
    surfaceGravity: 8.87,
    rotationPeriod: -20_996_798.4, // retrograde rotation
    axialTilt: 177.36,
    hasAtmosphere: true,
    atmosphere: {
      surfacePressure: 9_200_000,  // 92 bar
      surfaceDensity: 65.0,
      surfaceTemperature: 737,
      scaleHeight: 15_900,
      composition: [
        { formula: 'CO2', massFraction: 0.965, moleMass: 44.01 },
        { formula: 'N2', massFraction: 0.035, moleMass: 28.014 }
      ],
      model: 'exponential',
      karmanLine: 250_000
    },
    surfaceType: 'solid',
    color: '#e8c880'
  },
  titan: {
    id: 'titan',
    name: 'Titan',
    radius: 2_574_730,
    mass: 1.3452e23,
    mu: 8.9781e12,
    surfaceGravity: 1.352,
    rotationPeriod: 1_377_600,
    axialTilt: 0,
    hasAtmosphere: true,
    atmosphere: {
      surfacePressure: 146_700,    // 1.45 bar
      surfaceDensity: 5.3,
      surfaceTemperature: 94,
      scaleHeight: 40_000,
      composition: [
        { formula: 'N2', massFraction: 0.984, moleMass: 28.014 },
        { formula: 'CH4', massFraction: 0.014, moleMass: 16.04 },
        { formula: 'H2', massFraction: 0.002, moleMass: 2.016 }
      ],
      model: 'exponential',
      karmanLine: 700_000
    },
    surfaceType: 'solid',
    color: '#d4a04a'
  },
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    radius: 2_439_700,
    mass: 3.3011e23,
    mu: 2.2032e13,
    surfaceGravity: 3.7,
    rotationPeriod: 5_067_014.4,
    axialTilt: 0.034,
    hasAtmosphere: false,
    atmosphere: null,
    surfaceType: 'solid',
    color: '#8a7960'
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    radius: 69_911_000,
    mass: 1.8982e27,
    mu: 1.26686534e17,
    surfaceGravity: 24.79,
    rotationPeriod: 35_730,
    axialTilt: 3.13,
    hasAtmosphere: true,
    atmosphere: {
      surfacePressure: 100_000,    // 1 bar reference level
      surfaceDensity: 0.16,
      surfaceTemperature: 165,
      scaleHeight: 27_000,
      composition: [
        { formula: 'H2', massFraction: 0.898, moleMass: 2.016 },
        { formula: 'He', massFraction: 0.102, moleMass: 4.003 }
      ],
      model: 'exponential',
      karmanLine: 1_000_000
    },
    surfaceType: 'gaseous',
    color: '#c88b3a'
  },
  europa: {
    id: 'europa',
    name: 'Europa',
    radius: 1_560_800,
    mass: 4.7998e22,
    mu: 3.202e12,
    surfaceGravity: 1.315,
    rotationPeriod: 306_822,
    axialTilt: 0.1,
    hasAtmosphere: false,
    atmosphere: null,
    surfaceType: 'icy',
    color: '#c8c8d8'
  },
  ganymede: {
    id: 'ganymede',
    name: 'Ganymede',
    radius: 2_634_100,
    mass: 1.4819e23,
    mu: 9.887e12,
    surfaceGravity: 1.428,
    rotationPeriod: 618_153.4,
    axialTilt: 0.33,
    hasAtmosphere: false,
    atmosphere: null,
    surfaceType: 'icy',
    color: '#a08870'
  },
  enceladus: {
    id: 'enceladus',
    name: 'Enceladus',
    radius: 252_100,
    mass: 1.0802e20,
    mu: 7.211e9,
    surfaceGravity: 0.113,
    rotationPeriod: 118_386,
    axialTilt: 0,
    hasAtmosphere: false,
    atmosphere: null,
    surfaceType: 'icy',
    color: '#f0f0f0'
  }
}

// ─── Launch Site ──────────────────────────────────────────────────────────────
export interface LaunchSite {
  id: string
  name: string
  latitude: number       // degrees (geodetic)
  longitude: number      // degrees
  altitude: number       // m above reference surface
  celestialBody: CelestialBody
}

// ─── Mission Parameters ───────────────────────────────────────────────────────
export interface MissionParameters {
  missionName: string
  launchSite: LaunchSite
  targetOrbit: OrbitalTarget | null    // null for suborbital
  launchDateTime: string               // ISO 8601
  missionDescription: string
}

export interface OrbitalTarget {
  periapsis: number       // m above surface
  apoapsis: number        // m above surface
  inclination: number     // degrees
  raan: number            // Right Ascension of Ascending Node, degrees
  argumentOfPerigee: number  // degrees
}
