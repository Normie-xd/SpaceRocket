/// <reference types="vite/client" />

// ─── Tauri environment ────────────────────────────────────────────────────────
// The Tauri global is injected by the Tauri runtime.
// Use @tauri-apps/api/core for invoke() — no manual type declarations needed.

// ─── GLSL shader imports (Phase 4+) ──────────────────────────────────────────
declare module '*.glsl' {
  const content: string
  export default content
}
declare module '*.vert' {
  const content: string
  export default content
}
declare module '*.frag' {
  const content: string
  export default content
}
