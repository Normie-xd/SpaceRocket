import React, { useState } from 'react'
import { RocketBuilderView } from './views/RocketBuilder/RocketBuilderView'

type View = 'splash' | 'builder' | 'simulation' | 'analysis' | 'docs'

function App(): JSX.Element {
  const [view, setView] = useState<View>('splash')

  return (
    <div className="app-root">
      {view === 'splash' && <SplashScreen onNavigate={setView} />}
      {view === 'builder' && (
        <RocketBuilderView
          onBack={() => setView('splash')}
          onLaunch={() => setView('simulation')}
        />
      )}
      {view === 'simulation' && <Placeholder title="Simulation" onBack={() => setView('builder')} />}
      {view === 'analysis' && <Placeholder title="Analysis" onBack={() => setView('splash')} />}
      {view === 'docs' && <Placeholder title="Documentation" onBack={() => setView('splash')} />}
    </div>
  )
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
interface SplashScreenProps {
  onNavigate: (view: View) => void
}

function SplashScreen({ onNavigate }: SplashScreenProps): JSX.Element {
  return (
    <div style={styles.splash}>
      <div style={styles.splashInner}>
        {/* Logo */}
        <div style={styles.logoBlock}>
          <div style={styles.logoIcon}>🚀</div>
          <h1 style={styles.logoText}>SPACEROCKET</h1>
          <p style={styles.logoSub}>Professional Aerospace Simulation Platform</p>
        </div>

        {/* Navigation */}
        <div style={styles.navGrid}>
          <NavCard
            icon="🛠️"
            title="Rocket Builder"
            description="Design your rocket from real engineering parameters"
            accent="var(--accent-cyan)"
            onClick={() => onNavigate('builder')}
          />
          <NavCard
            icon="🌍"
            title="Simulation"
            description="Launch and simulate your rocket in 3D"
            accent="var(--accent-orange)"
            onClick={() => onNavigate('simulation')}
          />
          <NavCard
            icon="📊"
            title="Analysis"
            description="Post-flight telemetry, graphs, and reports"
            accent="var(--accent-green)"
            onClick={() => onNavigate('analysis')}
          />
          <NavCard
            icon="📚"
            title="Documentation"
            description="Engineering guide and specification library"
            accent="var(--accent-purple)"
            onClick={() => onNavigate('docs')}
          />
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            Phase 0 — Foundation Complete · v0.1.0
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────
interface NavCardProps {
  icon: string
  title: string
  description: string
  accent: string
  onClick: () => void
}

function NavCard({ icon, title, description, accent, onClick }: NavCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      style={{
        ...styles.navCard,
        borderColor: hovered ? accent : 'var(--border)',
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-panel)',
        boxShadow: hovered ? `0 0 20px ${accent}22` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ ...styles.navCardTitle, color: hovered ? accent : 'var(--text-primary)' }}>
        {title}
      </div>
      <div style={styles.navCardDesc}>{description}</div>
    </button>
  )
}

// ─── Placeholder View ─────────────────────────────────────────────────────────
function Placeholder({ title, onBack }: { title: string; onBack: () => void }): JSX.Element {
  return (
    <div style={{ ...styles.splash, gap: 24 }}>
      <div style={{ ...styles.logoText, fontSize: 24 }}>{title}</div>
      <p style={{ color: 'var(--text-muted)' }}>Coming in a future phase.</p>
      <button className="btn-secondary" onClick={onBack}>
        ← Back
      </button>
    </div>
  )
}

// ─── Inline Styles ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  splash: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 40,
    background: 'radial-gradient(ellipse at 50% 0%, #0f0f2a 0%, #0a0a0f 70%)',
  },
  splashInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 48,
    maxWidth: 900,
    width: '100%',
  },
  logoBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 56,
    marginBottom: 4,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 700,
    letterSpacing: '0.3em',
    color: 'var(--accent-cyan)',
    textShadow: '0 0 40px rgba(0,212,255,0.4)',
    fontFamily: 'var(--font-mono)',
  },
  logoSub: {
    color: 'var(--text-secondary)',
    letterSpacing: '0.15em',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    width: '100%',
  },
  navCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '28px 20px',
    border: '1px solid var(--border)',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '0.03em',
    marginBottom: 8,
    transition: 'color 200ms ease',
  },
  navCardDesc: {
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
}

export default App
