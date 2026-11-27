# SpaceRocket 🚀

> **Professional Aerospace Simulation Platform**  
> Physics-accurate 3D rocket engineering, flight simulation, and orbital mechanics.

---

## What is SpaceRocket?

SpaceRocket is a standalone desktop application where you design custom rockets from real engineering parameters, simulate launches with full physics fidelity, and visualize mission trajectories in a photorealistic 3D environment.

It is designed for:
- Students learning aerospace engineering
- Educators demonstrating rocket physics
- Enthusiasts modeling real-world mission profiles
- Researchers visualizing model behavior with custom parameters

---

## Core Features

| Feature | Description |
|---|---|
| **Rocket Builder** | Design custom rockets from real engineering parameters (engines, tanks, fins, fairings) |
| **Physics Simulation** | 6-DOF flight dynamics, US Standard Atmosphere, orbital mechanics, staging |
| **3D Visualization** | Photorealistic rendering with procedural rocket geometry and dynamic sky |
| **Solar System** | Earth, Moon, Mars, Venus, Titan — with real gravity and atmosphere models |
| **Telemetry** | Real-time HUD and post-flight analysis with full CSV/JSON export |
| **Documentation** | Integrated engineering guide and specification library |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Tauri v2 (Rust backend) |
| 3D Rendering | Three.js (custom GLSL shaders) |
| UI Framework | React + Vite |
| Language | TypeScript (Frontend) + Rust (Desktop Core) |
| Physics | Custom engine (Web Workers, RK4 integrator) |
| Storage | Native JSON document storage via Rust IPC |
| State | Zustand |
| Charts | Recharts |

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Rust 1.77+ & Cargo
- Git

### Install & Run
```bash
npm install
npm run dev
```

> Or run the Vite frontend preview standalone: `npm run dev:vite`

### Build Installer
```bash
npm run build
```

---

## Development Phases

- [x] **Phase 0** — Foundation & Tauri v2 Migration
- [x] **Phase 1** — Physics Engine Core (atmosphere, propulsion, Tsiolkovsky)
- [x] **Phase 2** — 6-DOF Simulation + Orbital Mechanics
- [x] **Phase 3** — Rocket Builder UI
- [x] **Phase 4** — 3D Renderer & Scene (Earth, sky, launch site)
- [x] **Phase 5** — Visual Effects (exhaust, re-entry, shockwave)
- [x] **Phase 6** — Live Simulation + Telemetry HUD
- [x] **Phase 7** — Documentation System
- [x] **Phase 8** — Post-Flight Analysis & Export
- [x] **Phase 9** — Settings, Shortcuts & Polish

## Project Documentation Links

- [Completed Project Summary (SPACEROCKET_COMPLETED.md)](./SPACEROCKET_COMPLETED.md)
- [System Architecture Blueprint (SpaceRocket_Blueprint.md)](./SpaceRocket_Blueprint.md)
- [In-App Engineering Documentation Data (docsData.ts)](./src/views/DocumentationView/docsData.ts)
- [In-App Documentation Browser (DocumentationView.tsx)](./src/views/DocumentationView/DocumentationView.tsx)

---

## Physics Models

- US Standard Atmosphere 1976 (ISA) + NRLMSISE-00 upper atmosphere
- Mach-dependent drag coefficient (Cd) lookup
- Thrust equation with real Isp and mass flow rate
- Tsiolkovsky rocket equation
- 6-DOF rigid body dynamics (RK4 integrator)
- WGS84 ellipsoidal gravity model
- Barrowman equations for stability (CoM vs CoP)
- Kepler orbital mechanics, Hohmann transfers
- Aerodynamic heating (stagnation temperature)

---

## License

MIT
