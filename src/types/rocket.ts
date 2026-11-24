// ─── Rocket Design Types ──────────────────────────────────────────────────────

export interface RocketDesign {
  id: string
  name: string
  components: RocketComponent[]
  createdAt: string
  updatedAt: string
}

// Union type — a component is one of these typed variants
export type RocketComponent =
  | NoseCone
  | BodyTube
  | PropellantTank
  | Engine
  | Fin
  | Fairing
  | Payload
  | Separator

// ─── Component Parameters ─────────────────────────────────────────────────────

export interface NoseCone {
  id: string
  type: 'noseCone'
  name: string
  parameters: NoseConeParams
}
export interface NoseConeParams {
  shape: 'ogive' | 'vonKarman' | 'conical' | 'parabolic' | 'bluntedOgive'
  length: number         // m
  baseDiameter: number   // m
  wallThickness: number  // m
  material: Material
  mass: number           // kg (structural, dry)
}

export interface BodyTube {
  id: string
  type: 'bodyTube'
  name: string
  parameters: BodyTubeParams
}
export interface BodyTubeParams {
  length: number         // m
  outerDiameter: number  // m
  wallThickness: number  // m
  material: Material
  mass: number           // kg
}

export interface PropellantTank {
  id: string
  type: 'propellantTank'
  name: string
  parameters: PropellantTankParams
}
export interface PropellantTankParams {
  length: number              // m
  outerDiameter: number       // m
  wallThickness: number       // m
  material: Material
  structuralMass: number      // kg (empty tank)
  propellantType: PropellantType
  oxidiserType: OxidiserType | null    // null for monopropellant / solid
  propellantMass: number      // kg
  oxidiserMass: number        // kg
  mixtureRatio: number        // oxidiser:fuel mass ratio
  ullagePercent: number       // 0–10 %
  pressurisation: 'blowdown' | 'regulated' | 'pump-fed'
  operatingPressure: number   // Pa
}

export interface Engine {
  id: string
  type: 'engine'
  name: string
  parameters: EngineParams
}
export interface EngineParams {
  thrustSeaLevel: number      // N
  thrustVacuum: number        // N
  ispSeaLevel: number         // s
  ispVacuum: number           // s
  nozzleExitDiameter: number  // m
  nozzleThroatDiameter: number // m
  expansionRatio: number
  gimbalRange: number         // degrees
  mass: number                // kg
  burnTime: number            // s
  restartable: boolean
  quantity: number            // number of engines in this cluster
  propellantType: PropellantType
  oxidiserType: OxidiserType | null
  cycleType: EngineCycle
  chamberPressure: number     // Pa
}

export interface Fin {
  id: string
  type: 'fin'
  name: string
  parameters: FinParams
}
export interface FinParams {
  shape: 'trapezoidal' | 'delta' | 'elliptical' | 'swept'
  quantity: number
  rootChord: number           // m
  tipChord: number            // m
  span: number                // m
  sweepAngle: number          // degrees
  thickness: number           // m
  material: Material
  mass: number                // kg (all fins combined)
  attachPosition: number      // m from base of rocket
}

export interface Fairing {
  id: string
  type: 'fairing'
  name: string
  parameters: FairingParams
}
export interface FairingParams {
  length: number              // m
  diameter: number            // m
  wallThickness: number       // m
  material: Material
  mass: number                // kg
  jettisionAltitude: number   // m — altitude at which fairing is shed
  separationVelocity: number  // m/s radial separation speed
}

export interface Payload {
  id: string
  type: 'payload'
  name: string
  parameters: PayloadParams
}
export interface PayloadParams {
  mass: number                // kg
  length: number              // m
  diameter: number            // m
  description: string
}

export interface Separator {
  id: string
  type: 'separator'
  name: string
  parameters: SeparatorParams
}
export interface SeparatorParams {
  mass: number                // kg
  separationImpulse: number   // N·s
  stageNumber: number         // which stage this separates (0-indexed from bottom)
}

// ─── Material Catalogue ───────────────────────────────────────────────────────
export type Material =
  | 'aluminiumAlloy'      // Al 7075 — density 2810 kg/m³, yield 503 MPa
  | 'stainlessSteelAISI304'
  | 'carbonFibreComposite'
  | 'titaniumAlloyTi6Al4V'
  | 'fibreglass'
  | 'inconel718'           // for engine bells
  | 'custom'

export interface MaterialProperties {
  name: string
  density: number          // kg/m³
  yieldStrength: number    // Pa
  ultimateTensileStrength: number  // Pa
  thermalConductivity: number      // W/(m·K)
  maxServiceTemp: number           // K
}

// ─── Propellant Catalogue ────────────────────────────────────────────────────
export type PropellantType =
  | 'RP1'           // kerosene
  | 'LH2'           // liquid hydrogen
  | 'LCH4'          // liquid methane
  | 'UDMH'          // unsymmetrical dimethylhydrazine
  | 'N2H4'          // hydrazine (monoprop)
  | 'solidAPCTHB'   // ammonium perchlorate composite (solid)
  | 'ethanolWater'
  | 'custom'

export type OxidiserType =
  | 'LOX'           // liquid oxygen
  | 'N2O4'          // nitrogen tetroxide
  | 'N2O'           // nitrous oxide
  | 'H2O2'          // hydrogen peroxide
  | 'custom'

// ─── Engine Cycle ────────────────────────────────────────────────────────────
export type EngineCycle =
  | 'gasGenerator'
  | 'staged'           // staged combustion
  | 'fullFlowStagedCombustion'  // FFSC (Raptor-style)
  | 'expander'
  | 'pressurant'       // pressure-fed
  | 'electric'         // electric pump-fed
  | 'solid'
