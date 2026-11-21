# 🚀 SpaceRocket — Professional Aerospace Simulation Platform
## Full System Blueprint & Design Document

> A physics-accurate, 3D-rendered rocket engineering and flight simulation platform intended for educational use, aerospace research visualization, and mission planning.

---

## 🎯 Vision & Scope

**What it is:**
A standalone desktop application where users design custom rockets from real engineering parameters, simulate launches with full physics fidelity, and visualize mission trajectories in a photorealistic 3D environment. Think of it as a "digital wind tunnel + orbital simulator + mission planner" in one.

**Who uses it:**
- Students learning aerospace engineering
- Educators demonstrating rocket physics
- Enthusiasts building intuition for real mission planning
- Eventually: space agencies visualizing model behavior with their own parameter sets

**Core Pillars:**
1. **Build** — Custom rocket designer with real engineering inputs
2. **Simulate** — Physically accurate multi-stage flight simulation
3. **Visualize** — Photorealistic 3D render with live telemetry overlay
4. **Analyze** — Post-flight data, graphs, and mission reports

---

## 🛠️ Tech Stack Decision

### Why Electron + Three.js + TypeScript

| Layer | Technology | Rationale |
|---|---|---|
| **Desktop Shell** | **Electron.js** | Cross-platform, can bundle heavy assets, no browser memory cap, file I/O for saving rockets |
| **3D Rendering** | **Three.js** (custom shaders) | Maximum control over rendering pipeline; we write our own GLSL shaders for exhaust plumes, atmospheric scattering, re-entry glow |
| **UI Framework** | **React + Vite** (inside Electron) | Component-based panels for HUD, telemetry, rocket builder |
| **Physics Engine** | **Custom TypeScript** running in **Web Workers** | We CANNOT use a generic physics engine — rocket physics (propulsion, orbital mechanics, atmospheric drag) requires domain-specific equations. Workers keep simulation non-blocking |
| **Backend / Data** | **Node.js** (Electron main process) + **SQLite** via `better-sqlite3` | Save/load rocket designs, mission logs, telemetry recordings — no network required, fully offline |
| **Math Library** | `mathjs` + custom vector/quaternion library | Orbital mechanics math, rotation matrices |
| **Charts / Telemetry** | **Chart.js** or **Recharts** | Real-time telemetry graphs (altitude, velocity, acceleration, thrust, Mach, dynamic pressure) |
| **Language** | **TypeScript** throughout | Safety for complex physics math, great IDE support |

---

## ⚙️ Physics Models (The Core — What Makes It Real)

This is where most engineering effort goes. Every model below is a real aerospace standard.

### 1. Atmospheric Model
- **US Standard Atmosphere 1976** (ISA) — temperature, pressure, density vs altitude up to 86 km
- **NRLMSISE-00** model for upper atmosphere (86 km – 1000 km) — accounts for solar activity
- Real speed of sound vs altitude → Mach number calculation

### 2. Aerodynamics
- **Drag force**: `F_drag = 0.5 × ρ × v² × Cd × A`
  - Cd (drag coefficient) varies with Mach number (subsonic, transonic, supersonic, hypersonic regimes)
  - Mach-dependent Cd lookup tables (user can input or use presets)
- **Lift force** from fins (stability analysis)
- **Dynamic pressure (Max-Q)** — critical structural load calculation
- **Angle of Attack** effect on drag and lift

### 3. Propulsion
- **Thrust equation**: `F = ṁ × Ve + (Pe - Pa) × Ae` (fully expanded form)
- **Specific Impulse (Isp)** — real propellant efficiency metric
- **Mass flow rate**: `ṁ = F / (Isp × g0)`
- **Throttle curve** — user-defined thrust vs time profile
- **Multi-engine configurations** — vectored thrust, gimbaling
- **Propellant types** — LOX/LH2, LOX/RP-1, N2O4/UDMH, solid propellants
- **Staging**: automatic mass jettison, engine ignition sequencing
- **Thrust Vector Control (TVC)** — gimbal angle affects trajectory

### 4. Rocket Equation & Mass Budget
- **Tsiolkovsky Rocket Equation**: `Δv = Isp × g0 × ln(m0/mf)`
- Real-time mass tracking: propellant burn depletes mass → affects center of mass (CoM)
- **Center of Pressure (CoP)** vs **Center of Mass (CoM)** — stability margin calculation (Barrowman equations)

### 5. Flight Dynamics & Guidance
- **6 Degrees of Freedom (6-DOF)** rigid body simulation
  - 3 translational (x, y, z position)
  - 3 rotational (pitch, yaw, roll)
- **Gravity model**: WGS84 ellipsoidal Earth, gravity decreases with altitude (`g = g0 × (R_Earth/(R_Earth + h))²`)
- **Gravity Turn maneuver** — realistic trajectory shaping
- **Pitch program** — user-defined pitch vs time profile
- **PID guidance controller** — keeps rocket on target trajectory

### 6. Orbital Mechanics
- **Kepler's Laws** — orbital period, velocity, apogee/perigee
- **Patched conic approximation** — sphere of influence transitions
- **Hohmann transfer** — orbit raising maneuvers
- **Orbital insertion burn** — circularization delta-v
- **Re-entry dynamics** — atmospheric drag deceleration, heating
- **Gravitational parameter (μ)** for Earth, Moon (future: other bodies)

### 7. Structural / Thermal (Simplified but Real)
- **Stress analysis** — axial load, bending moment vs altitude/acceleration
- **Maximum dynamic pressure (Max-Q)** — structural limit flag
- **Aerodynamic heating** — stagnation temperature at nose cone (re-entry or high Mach)
  - `T_stag = T_ambient × (1 + (γ-1)/2 × M²)` (adiabatic stagnation)

---

## 🏗️ Application Architecture

```
SpaceRocket/
├── electron/                   # Electron main process (Node.js)
│   ├── main.ts                 # App entry, window management
│   ├── ipc/                    # IPC handlers (file I/O, DB queries)
│   └── db/                     # SQLite database layer
│       ├── schema.sql
│       └── queries.ts
│
├── src/                        # React frontend (Vite)
│   ├── App.tsx                 # Root component, view routing
│   ├── views/
│   │   ├── RocketBuilder/      # Drag-and-drop rocket designer
│   │   ├── SimulationView/     # 3D viewport + live telemetry
│   │   ├── AnalysisView/       # Post-flight data & graphs
│   │   └── DocumentationView/  # Integrated guide / spec library
│   │
│   ├── components/
│   │   ├── HUD/                # Altitude, velocity, Mach, G-force overlay
│   │   ├── TelemetryPanel/     # Real-time graphs
│   │   ├── StageManager/       # Staging sequence UI
│   │   └── CameraControls/     # Orbit, follow, free camera modes
│   │
│   ├── engine/                 # Physics simulation (Web Workers)
│   │   ├── SimulationWorker.ts # Main simulation loop (runs off main thread)
│   │   ├── atmosphere/
│   │   │   ├── ISA.ts          # US Standard Atmosphere 1976
│   │   │   └── NRLMSISE.ts     # Upper atmosphere model
│   │   ├── aerodynamics/
│   │   │   ├── DragModel.ts    # Mach-dependent Cd
│   │   │   └── Stability.ts    # CoM vs CoP, Barrowman equations
│   │   ├── propulsion/
│   │   │   ├── Engine.ts       # Thrust, Isp, mass flow
│   │   │   └── PropellantTank.ts
│   │   ├── dynamics/
│   │   │   ├── SixDOF.ts       # 6-DOF rigid body integrator (RK4)
│   │   │   ├── Gravity.ts      # WGS84 gravity model
│   │   │   └── OrbitalMechanics.ts
│   │   └── thermal/
│   │       └── HeatModel.ts
│   │
│   ├── renderer/               # Three.js 3D rendering
│   │   ├── SceneManager.ts     # Scene setup, lighting, camera
│   │   ├── Earth.ts            # Photorealistic Earth (PBR textures + atmosphere shader)
│   │   ├── RocketMesh.ts       # Procedural rocket geometry from parameters
│   │   ├── ExhaustPlume.ts     # Custom GLSL particle shader
│   │   ├── TrajectoryLine.ts   # Orbital path visualization
│   │   ├── ReentryEffect.ts    # Heat shield glow shader
│   │   └── shaders/            # GLSL source files
│   │       ├── atmosphere.vert/frag
│   │       ├── exhaust.vert/frag
│   │       └── reentry.vert/frag
│   │
│   └── store/                  # State management (Zustand)
│       ├── rocketStore.ts      # Active rocket design
│       ├── simulationStore.ts  # Sim state, telemetry buffer
│       └── missionStore.ts     # Mission parameters
│
├── assets/
│   ├── textures/               # Earth, Moon surface maps (NASA Blue Marble)
│   ├── hdri/                   # Space skybox (Poly Haven CC0)
│   └── fonts/                  # UI fonts
│
├── docs/                       # In-app documentation system
│   ├── guide/                  # Engineering guide (Markdown)
│   └── specs/                  # Pre-built rocket specifications (JSON)
│
└── package.json
```

---

## 🎨 Visual Design (3D Renderer)

### Earth Rendering
- **NASA Blue Marble** textures (8K diffuse, cloud layer, specular for oceans)
- **Atmospheric scattering shader** (Rayleigh + Mie scattering) — limb glow, horizon blue
- **City lights** on night side
- **Cloud layer** — semi-transparent, rotating

### Rocket Rendering
- **Procedurally generated mesh** from builder parameters (no pre-built models)
  - Nose cone (ogive, Von Kármán, conical) — mathematically generated geometry
  - Cylindrical body sections with configurable diameter/length
  - Fins (trapezoidal, delta — procedural geometry)
  - Engine bell (parabolic curve → lathe geometry)
- **PBR materials** — metallic, painted aluminum, carbon fiber appearance
- **Exhaust plume shader** — temperature-based color (blue → white → orange → red), volumetric noise, screen-space glow

### Launch Environment
- **Launch pad** — procedural geometry or modeled in code
- **Ground** — textured terrain with satellite imagery
- **Weather effects** — clouds, haze (configurable for realism)

### Space Environment
- **Starfield** — 100,000-star catalog (Yale Bright Star Catalog positions)
- **Moon** — accurate position based on mission date/time
- **Sun** — directional light source, solar panels react to angle
- **Orbital path** — colored arc showing predicted and actual trajectory

---

## 📐 Rocket Builder (Design Interface)

### Component System
Each component has real engineering parameters:

| Component | Parameters |
|---|---|
| **Nose Cone** | Shape (ogive/conical/Von Kármán/blunted), length, diameter, material, wall thickness |
| **Body Tube** | Diameter, length, material (Al, steel, CF, Ti), wall thickness |
| **Propellant Tank** | Fuel type, oxidizer type, volume, ullage %, pressurization |
| **Engine** | Thrust (sea-level + vacuum), Isp (SL + vac), nozzle exit area, gimbal range, burn time |
| **Fins** | Shape, root chord, tip chord, span, sweep angle, material, quantity |
| **Payload Fairing** | Diameter, length, jettison altitude |
| **Payload** | Mass, dimensions |
| **Separation System** | Staging type, separation velocity |

### Analysis Tools (pre-flight)
- **Delta-V budget** calculator per stage
- **Stability margin** (should be > 1 caliber) → warning if unstable
- **Mass budget** (dry mass, propellant mass, payload mass fraction)
- **Thrust-to-Weight Ratio (TWR)** at sea level and vacuum
- **Max-Q altitude** prediction
- **Payload to orbit** estimation

---

## 📊 Simulation & Telemetry

### Real-Time HUD Overlay
- Altitude (AGL / ASL)
- Velocity (surface, orbital)
- Mach number
- G-force (axial + lateral)
- Dynamic pressure (q)
- Angle of Attack
- Downrange distance
- Stage fuel remaining (%)
- Thrust output
- Mass remaining
- Time to apogee / apogee altitude

### Post-Flight Analysis
- Altitude vs time
- Velocity vs time
- Acceleration vs time
- Drag force vs time
- Thrust vs time
- Mass vs time
- Orbital elements at insertion
- Max-Q point highlighted
- Stage separation events marked
- Full telemetry CSV export

---

## 📚 Documentation System (In-App)

### Built-in Guide
- **Engineering fundamentals** — drag, thrust, Isp, staging theory
- **Stability analysis** — why CoM must be ahead of CoP
- **Propellant guide** — real propellant combinations, their trade-offs
- **Orbital mechanics primer** — Hohmann transfers, delta-v maps

### Specification Library (JSON format — extensible by user)
- Pre-defined component presets (real-world parameter ranges)
- Reference mission profiles (LEO, GTO, lunar)
- Material property tables
- **User can add their own specs** — load custom JSON files

---

## 🏁 Development Phases & Milestones

### Phase 0 — Foundation (Git Init point ✅)
- Project scaffolding (Electron + React + Vite + TypeScript)
- Build system configuration
- SQLite database schema
- Git repository initialized with `.gitignore`, `README.md`
- **Commit:** `chore: initial project scaffolding`

### Phase 1 — Physics Engine Core
- US Standard Atmosphere model
- Basic propulsion equations
- Tsiolkovsky rocket equation
- Simple 1D flight simulation (no gravity turn yet)
- Unit tests for physics functions
- **Commit:** `feat: core physics engine — atmosphere, propulsion, rocket equation`

### Phase 2 — 6-DOF Simulation + Orbital Mechanics
- Full 6-DOF integrator (RK4)
- WGS84 gravity model
- Atmospheric drag (Mach-dependent Cd)
- Staging system
- Gravity turn maneuver
- Orbital mechanics (Kepler, Hohmann)
- **Commit:** `feat: 6-DOF flight dynamics, orbital mechanics, staging`

### Phase 3 — Rocket Builder UI
- Component parameter input forms
- Procedural rocket mesh preview (3D) from parameters
- Pre-flight analysis dashboard (delta-v, stability, TWR)
- Save/load rocket designs (SQLite)
- **Commit:** `feat: rocket builder — component system, pre-flight analysis, 3D preview`

### Phase 4 — 3D Renderer & Scene
- Earth with PBR textures + atmospheric scattering shader
- Space environment (starfield, sun, moon)
- Launch pad scene
- Camera modes (follow rocket, orbit view, free cam)
- **Commit:** `feat: 3D renderer — Earth, space environment, camera system`

### Phase 5 — Exhaust, Effects & Visual Polish
- Exhaust plume particle shader (GLSL)
- Stage separation effects
- Re-entry heat glow shader
- Condensation shockwave (Prandtl-Glauert cone at transonic)
- Trajectory arc visualization
- **Commit:** `feat: visual effects — exhaust plume, re-entry, shockwave, trajectory`

### Phase 6 — Live Simulation + Telemetry
- Physics worker ↔ renderer real-time bridge
- HUD overlay (all telemetry values live)
- Real-time telemetry graphs
- Simulation speed control (1x, 10x, 100x, pause)
- Event log (Max-Q, staging, MECO, orbit insertion)
- **Commit:** `feat: live simulation loop, HUD overlay, telemetry panel`

### Phase 7 — Documentation System
- In-app guide viewer (Markdown renderer)
- Specification library browser
- Component parameter tooltips with engineering explanations
- **Commit:** `feat: documentation system — guide, spec library`

### Phase 8 — Post-Flight Analysis
- Full telemetry playback
- Graph suite (altitude, velocity, acceleration, drag, thrust, mass)
- Orbital elements display
- CSV/JSON export
- **Commit:** `feat: post-flight analysis — telemetry replay, graphs, export`

### Phase 9 — Polish, Packaging & Installer
- App icon, splash screen
- Settings (units: metric/imperial, simulation fidelity)
- Keyboard shortcuts
- Electron auto-updater ready
- Windows `.exe` installer (via electron-builder)
- **Commit:** `feat: app packaging, installer, settings, polish`

---

## ❓ Open Questions Before We Start

1. **Units system preference?** — Metric (SI) only, or metric + imperial toggle?
2. **Celestial bodies in scope for v1?** — Earth only? Or Moon + Mars gravity/atmosphere too?
3. **Simulation fidelity mode?** — Should we have a "simplified" (fast) vs "high fidelity" (slower, more accurate) toggle?
4. **Do you have a name for the app?** — Or should I go with `SpaceRocket` from the workspace?
5. **Any specific atmospheric data format** you'd want to import? (some agencies have their own atmosphere tables)
6. **Color theme?** — Dark "mission control" aesthetic? Space-black with orange/cyan accents?

---

## 🔧 When to Initialize Git

**Initialize after you answer the open questions above.**
The first commit will include the complete scaffolded project with the agreed architecture — no dead code, clean slate.
