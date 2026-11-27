import React from 'react';
import { AEROSPACE_MATERIALS, type MaterialSpec } from './docsData';

export const MaterialCatalogView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)' }}>
          Aerospace Materials & Structural Properties
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Reference physical properties, strength-to-weight ratios, and thermal limits for launch vehicle structures.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {AEROSPACE_MATERIALS.map((mat: MaterialSpec) => {
          // Specific strength ratio (Yield Strength / Density) in kN*m/kg
          const specificStrength = ((mat.yieldStrengthMpa * 1e6) / mat.densityKgM3) / 1000;

          return (
            <div
              key={mat.id}
              className="panel"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{mat.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>({mat.category})</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  Specific Strength: {specificStrength.toFixed(1)} kN·m/kg
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Density: </span>
                  <span style={{ fontWeight: 600 }}>{mat.densityKgM3} kg/m³</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Yield: </span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{mat.yieldStrengthMpa} MPa</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ultimate: </span>
                  <span style={{ fontWeight: 600 }}>{mat.ultimateStrengthMpa} MPa</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Max Temp: </span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{mat.maxServiceTempK} K</span>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>Aerospace Applications:</strong> {mat.applications}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
