/**
 * Aerospace Engineering Documentation Knowledge Base & Spec Data
 */

export interface DocArticle {
  id: string;
  category: 'propulsion' | 'aerodynamics' | 'orbital' | 'materials' | 'engines';
  title: string;
  subtitle: string;
  content: string; // Markdown-formatted rich educational text
}

export interface EngineSpec {
  id: string;
  name: string;
  manufacturer: string;
  vehicle: string;
  propellants: string;
  cycle: string;
  thrustSeaLevelKn: number;
  thrustVacuumKn: number;
  ispSeaLevelSec: number;
  ispVacuumSec: number;
  chamberPressureBar: number;
  expansionRatio: number;
  massKg: number;
  twrVacuum: number;
  description: string;
}

export interface MaterialSpec {
  id: string;
  name: string;
  category: string;
  densityKgM3: number;
  yieldStrengthMpa: number;
  ultimateStrengthMpa: number;
  maxServiceTempK: number;
  applications: string;
}

export const REAL_WORLD_ENGINES: EngineSpec[] = [
  {
    id: 'merlin-1d',
    name: 'Merlin 1D',
    manufacturer: 'SpaceX',
    vehicle: 'Falcon 9 / Falcon Heavy (First & Second Stage)',
    propellants: 'RP-1 (Kerosene) / LOX (Liquid Oxygen)',
    cycle: 'Gas Generator',
    thrustSeaLevelKn: 845,
    thrustVacuumKn: 914,
    ispSeaLevelSec: 282,
    ispVacuumSec: 311,
    chamberPressureBar: 97,
    expansionRatio: 16,
    massKg: 470,
    twrVacuum: 198,
    description: 'The highest thrust-to-weight ratio liquid rocket engine ever flown. Uses sub-cooled propellants for density increase.'
  },
  {
    id: 'raptor-2',
    name: 'Raptor 2',
    manufacturer: 'SpaceX',
    vehicle: 'Starship / Super Heavy Booster',
    propellants: 'LCH4 (Liquid Methane) / LOX',
    cycle: 'Full-Flow Staged Combustion (FFSC)',
    thrustSeaLevelKn: 2255,
    thrustVacuumKn: 2450,
    ispSeaLevelSec: 327,
    ispVacuumSec: 350,
    chamberPressureBar: 300,
    expansionRatio: 34,
    massKg: 1600,
    twrVacuum: 156,
    description: 'First production Full-Flow Staged Combustion engine. Uses methane for clean burning, reusability, and in-situ Mars production.'
  },
  {
    id: 'rs-25',
    name: 'RS-25 (SSME)',
    manufacturer: 'Aerojet Rocketdyne',
    vehicle: 'Space Shuttle Orbiter / NASA Space Launch System (SLS)',
    propellants: 'LH2 (Liquid Hydrogen) / LOX',
    cycle: 'Fuel-Rich Staged Combustion',
    thrustSeaLevelKn: 1860,
    thrustVacuumKn: 2279,
    ispSeaLevelSec: 366,
    ispVacuumSec: 452,
    chamberPressureBar: 206,
    expansionRatio: 77.5,
    massKg: 3527,
    twrVacuum: 66,
    description: 'Legendary cryogenic workhorse with an extraordinary vacuum Isp of 452 seconds, operating near theoretical thermodynamic limits.'
  },
  {
    id: 'rl10-c',
    name: 'RL10-C',
    manufacturer: 'Aerojet Rocketdyne',
    vehicle: 'Centaur / Vulcan Centaur / Delta IV Upper Stage',
    propellants: 'LH2 (Liquid Hydrogen) / LOX',
    cycle: 'Expander Cycle',
    thrustSeaLevelKn: 0,
    thrustVacuumKn: 106,
    ispSeaLevelSec: 200,
    ispVacuumSec: 453.8,
    chamberPressureBar: 44,
    expansionRatio: 155,
    massKg: 301,
    twrVacuum: 36,
    description: 'The benchmark of upper stage propulsion. Expander cycle heats LH2 through the nozzle cooling jacket to spin the turbopump.'
  },
  {
    id: 'rd-180',
    name: 'RD-180',
    manufacturer: 'NPO Energomash',
    vehicle: 'Atlas V Booster',
    propellants: 'RP-1 / LOX',
    cycle: 'Oxygen-Rich Staged Combustion',
    thrustSeaLevelKn: 3827,
    thrustVacuumKn: 4152,
    ispSeaLevelSec: 311,
    ispVacuumSec: 338,
    chamberPressureBar: 257,
    expansionRatio: 36.8,
    massKg: 5480,
    twrVacuum: 77,
    description: 'Dual-combustion chamber engine utilizing oxygen-rich staged combustion at extreme chamber pressures.'
  }
];

export const AEROSPACE_MATERIALS: MaterialSpec[] = [
  {
    id: 'al-li-2195',
    name: 'Aluminium-Lithium Alloy 2195',
    category: 'Metallic / Lightweight Alloy',
    densityKgM3: 2710,
    yieldStrengthMpa: 580,
    ultimateStrengthMpa: 620,
    maxServiceTempK: 420,
    applications: 'Cryogenic fuel tank walls, Space Shuttle External Tank (Super Lightweight Tank), Falcon 9 stage barrels.'
  },
  {
    id: 'carbon-fiber-epoxy',
    name: 'Carbon-Fiber Reinforced Polymer (CFRP)',
    category: 'Advanced Composite',
    densityKgM3: 1550,
    yieldStrengthMpa: 800,
    ultimateStrengthMpa: 1200,
    maxServiceTempK: 450,
    applications: 'Payload fairings, interstage adapters, high-pressure composite overwrapped pressure vessels (COPVs), aerodynamic fins.'
  },
  {
    id: 'inconel-718',
    name: 'Inconel 718 (Nickel Superalloy)',
    category: 'High-Temperature Superalloy',
    densityKgM3: 8190,
    yieldStrengthMpa: 1100,
    ultimateStrengthMpa: 1375,
    maxServiceTempK: 980,
    applications: 'Rocket engine combustion chamber liners, turbopump turbine wheels, exhaust nozzle exit cones.'
  },
  {
    id: 'stainless-304l',
    name: 'Austenitic Stainless Steel 304L / 301',
    category: 'Cryogenic Structural Steel',
    densityKgM3: 7900,
    yieldStrengthMpa: 310,
    ultimateStrengthMpa: 620,
    maxServiceTempK: 1150,
    applications: 'Starship fuselage and propellant tanks. High strength at cryogenic temperatures and outstanding high-temperature heat tolerance.'
  },
  {
    id: 'titanium-6al4v',
    name: 'Titanium Grade 5 (Ti-6Al-4V)',
    category: 'Titanium Alloy',
    densityKgM3: 4430,
    yieldStrengthMpa: 880,
    ultimateStrengthMpa: 950,
    maxServiceTempK: 670,
    applications: 'Engine gimbal mounts, titanium grid fins for atmospheric guidance, high-stress structural joints.'
  }
];

export const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'tsiolkovsky-rocket-equation',
    category: 'propulsion',
    title: 'The Tsiolkovsky Rocket Equation & Mass Ratio',
    subtitle: 'The fundamental law governing all chemical and nuclear rocket propulsion',
    content: `
### The Tsiolkovsky Equation

Published in 1903 by Konstantin Tsiolkovsky, this equation calculates the change in velocity (\\(\\Delta v\\)) achievable by a rocket vehicle:

$$\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_0}{m_f}\\right) = v_e \\cdot \\ln\\left(\\frac{m_0}{m_f}\\right)$$

Where:
- **\\(\\Delta v\\)**: Total velocity change the vehicle can produce (m/s).
- **\\(I_{sp}\\)**: Specific impulse of the rocket engine (seconds).
- **\\(g_0\\)**: Standard gravitational acceleration ($9.80665\\text{ m/s}^2$).
- **\\(v_e = I_{sp} \\cdot g_0\\)**: Effective exhaust velocity (m/s).
- **\\(m_0\\)**: Initial total wet mass (propellant + structure + payload).
- **\\(m_f\\)**: Final burnout / dry mass (structure + payload).

---

### The Tyranny of the Rocket Equation

Notice the logarithmic term $\\ln(m_0 / m_f)$. Because the logarithm grows very slowly:
- To double your $\\Delta v$ at constant $I_{sp}$, you must square the mass ratio $m_0 / m_f$.
- Reaching Low Earth Orbit (LEO) requires approximately **$9,200\\text{ m/s}$** of $\\Delta v$ (orbital velocity of $7.8\\text{ km/s}$ plus $1.4\\text{ km/s}$ of gravity and aerodynamic drag losses).
- With a kerosene engine ($I_{sp} \\approx 300\\text{ s}$), the required mass ratio is:
  $$\\frac{m_0}{m_f} = e^{\\frac{9200}{300 \\cdot 9.80665}} \\approx e^{3.127} \\approx 22.8$$
- This means **over 95.6%** of the vehicle's initial mass at the launch pad must be pure propellant, leaving less than 4.4% for all engines, tanks, avionics, and payload!
- This explains why **multi-stage staging** is necessary: dropping spent tankage and engines sheds structural dry mass so upper stages can accelerate efficiently.
`
  },
  {
    id: 'barrowman-stability',
    category: 'aerodynamics',
    title: 'Barrowman Stability & Aerodynamic Center of Pressure',
    subtitle: 'Why Center of Pressure must be located behind Center of Mass',
    content: `
### Aerodynamic Stability Margin

For an unguided or passively stable rocket, aerodynamic forces must produce a **restoring moment** whenever the vehicle rotates at an angle of attack ($\\alpha$) relative to the oncoming airflow.

---

### Key Aerodynamic Centers

1. **Center of Mass ($X_{cg}$)**:
   The balance point where the total gravitational force acts. As propellants burn from bottom tanks upwards, $X_{cg}$ moves continuously during flight.

2. **Center of Pressure ($X_{cp}$)**:
   The point where all aerodynamic normal forces (nose cone, body tubes, transitions, and fins) balance out.

---

### The Barrowman Condition:

$$\\text{Static Margin (Calibers)} = \\frac{X_{cp} - X_{cg}}{D_{ref}}$$

Where $D_{ref}$ is the maximum body tube diameter.

- **Stable ($S \\ge 1.0\\text{ calibers}$)**:
  $X_{cp}$ is behind $X_{cg}$. If the rocket tilts, the aerodynamic lift on the tail fins pushes the tail back, restoring the nose into the relative wind.
- **Neutrally Stable ($S \\approx 0$)**:
  $X_{cp}$ and $X_{cg}$ coincide. Any crosswind will cause the rocket to drift without restoring torque.
- **Unstable ($S < 0$)**:
  $X_{cp}$ is ahead of $X_{cg}$. Aerodynamic forces will flip the rocket sideways (tumbling). Active Thrust Vector Control (TVC) or fins are strictly required.
- **Over-Stable ($S > 4.0\\text{ calibers}$)**:
  Excessive fin area causes the rocket to aggressively turn into horizontal crosswinds ("weathercocking"), compromising vertical altitude gain.
`
  },
  {
    id: 'orbital-mechanics-hohmann',
    category: 'orbital',
    title: 'Orbital Mechanics & Hohmann Transfer Orbits',
    subtitle: 'Transferring between circular orbits with minimum Delta-V expenditure',
    content: `
### Kepler's Laws & Orbit Geometry

A closed orbit around a central body with gravitational parameter $\\mu$ is an ellipse governed by the **Vis-Viva Equation**:

$$v^2 = \\mu \\left( \\frac{2}{r} - \\frac{1}{a} \\right)$$

Where:
- $v$: Orbital velocity at radius $r$.
- $\\mu$: Standard gravitational parameter ($3.986004418 \\times 10^{14}\\text{ m}^3/\\text{s}^2$ for Earth).
- $a$: Semi-major axis of the orbit.

---

### The Hohmann Transfer

Proposed by Walter Hohmann in 1925, this is the most fuel-efficient two-impulse maneuver between two coplanar circular orbits ($r_1$ and $r_2$):

1. **First Burn (Departure at $r_1$)**:
   $$\\Delta v_1 = \\sqrt{\\frac{\\mu}{r_1}} \\left( \\sqrt{\\frac{2 r_2}{r_1 + r_2}} - 1 \\right)$$
   This puts the spacecraft onto an elliptical transfer orbit whose periapsis is $r_1$ and apoapsis is $r_2$.

2. **Coast Phase**:
   Spacecraft coasts along the half-ellipse for transfer time:
   $$t_{transfer} = \\pi \\sqrt{\\frac{a_{transfer}^3}{\\mu}} = \\pi \\sqrt{\\frac{(r_1 + r_2)^3}{8 \\mu}}$$

3. **Second Burn (Circularization at $r_2$)**:
   $$\\Delta v_2 = \\sqrt{\\frac{\\mu}{r_2}} \\left( 1 - \\sqrt{\\frac{2 r_1}{r_1 + r_2}} \\right)$$
   This circularizes the orbit at the target radius $r_2$.
`
  },
  {
    id: 'propellant-chemistry',
    category: 'propulsion',
    title: 'Propellant Chemistry: RP-1 vs LH2 vs Methane',
    subtitle: 'The engineering trade-offs between liquid rocket fuels',
    content: `
### Propellant Performance Comparison

| Propellant Combination | Oxidizer / Fuel Ratio | Sea Level $I_{sp}$ (s) | Vacuum $I_{sp}$ (s) | Bulk Density ($\\text{kg/m}^3$) | Boiling Point (K) |
|---|---|---|---|---|---|
| **RP-1 (Kerosene) / LOX** | 2.56 | 280–305 | 310–348 | ~1020 | 210 / 90 (LOX) |
| **LCH4 (Methane) / LOX** | 3.55 | 325–335 | 350–380 | ~830 | 111 / 90 |
| **LH2 (Hydrogen) / LOX** | 5.50–6.0 | 365–390 | 445–465 | ~360 | 20 / 90 |
| **Solid (APCP)** | N/A | 240–265 | 265–290 | ~1750 | Ambient solid |

---

### Engineering Trade-Offs

- **RP-1 / LOX**:
  High density means compact fuel tanks and smaller aerodynamic drag profiles. Ideal for booster first stages (e.g. Falcon 9, Atlas V, Saturn V F-1). Produces coking/soot, making rapid engine reuse difficult.

- **LH2 / LOX (Hydrolox)**:
  Unrivaled specific impulse (>450 s). However, liquid hydrogen has an extremely low density ($71\\text{ kg/m}^3$), requiring cavernous fuel tanks that add dry structural mass and aerodynamic drag. Excellent for upper stages (Centaur, SLS Core, Space Shuttle).

- **LCH4 / LOX (Methalox)**:
  The modern sweet spot chosen by SpaceX (Raptor), Blue Origin (BE-4), and Rocket Lab (Neutron). Clean combustion with zero soot enables hundreds of reuses without teardown. Boiling point (111 K) is close to LOX (90 K), allowing simplified common bulkheads.
`
  }
];
