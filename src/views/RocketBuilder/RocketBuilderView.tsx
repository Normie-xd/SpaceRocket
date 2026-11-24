import React, { useState, useMemo } from 'react';
import { useRocketStore } from '../../store/rocketStore';
import { ComponentPalette } from './ComponentPalette';
import { ComponentInspector } from './ComponentInspector';
import { PreflightDashboard } from './PreflightDashboard';
import { computePreflightAnalysis } from '../../engine/analytics/PreflightAnalysis';
import { ROCKET_PRESETS } from './RocketPresets';
import type { RocketComponent, RocketDesign } from '../../types/rocket';

interface RocketBuilderViewProps {
  onBack: () => void;
  onLaunch: (design: RocketDesign) => void;
}

export const RocketBuilderView: React.FC<RocketBuilderViewProps> = ({ onBack, onLaunch }) => {
  const { currentDesign, setCurrentDesign, addComponent, removeComponent, updateComponent, reorderComponents } = useRocketStore();
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Initialize with Zephyr-1 preset if empty
  React.useEffect(() => {
    if (!currentDesign) {
      setCurrentDesign(ROCKET_PRESETS[1]); // Zephyr-1 Two-Stage
    }
  }, [currentDesign, setCurrentDesign]);

  const activeDesign: RocketDesign = currentDesign || ROCKET_PRESETS[1];

  // Preflight analysis calculations (re-computed whenever design updates)
  const analysisReport = useMemo(() => {
    return computePreflightAnalysis(activeDesign);
  }, [activeDesign]);

  const selectedComponent = useMemo(() => {
    return activeDesign.components.find((c) => c.id === selectedComponentId) || activeDesign.components[0] || null;
  }, [activeDesign, selectedComponentId]);

  const handleLoadPreset = (preset: RocketDesign) => {
    setCurrentDesign({ ...preset, id: crypto.randomUUID() });
    setSelectedComponentId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < activeDesign.components.length) {
      reorderComponents(index, target);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Main Menu
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🚀</span>
            <input
              type="text"
              value={activeDesign.name}
              onChange={(e) => setCurrentDesign({ ...activeDesign, name: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-bright)',
                color: 'var(--text-primary)',
                fontSize: 18,
                fontWeight: 700,
                outline: 'none',
                padding: '2px 4px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Preset Selector */}
          <select
            onChange={(e) => {
              const p = ROCKET_PRESETS.find((pr) => pr.id === e.target.value);
              if (p) handleLoadPreset(p);
            }}
            defaultValue=""
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            <option value="" disabled>Load Reference Preset...</option>
            {ROCKET_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={() => onLaunch(activeDesign)}
            disabled={!analysisReport.flightFeasibility.canLiftoff}
            style={{
              opacity: analysisReport.flightFeasibility.canLiftoff ? 1 : 0.5,
              cursor: analysisReport.flightFeasibility.canLiftoff ? 'pointer' : 'not-allowed'
            }}
          >
            Launch Simulation →
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', flex: 1, overflow: 'hidden', padding: 12, gap: 12 }}>
        
        {/* Left Column: Palette */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ComponentPalette onAddComponent={(comp) => {
            addComponent(comp);
            setSelectedComponentId(comp.id);
          }} />
        </div>

        {/* Center Column: Visual Stack & Component Tree */}
        <div
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: 16,
            gap: 12,
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Rocket Assembly Stack (Top to Base)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 500 }}>
            {activeDesign.components.map((comp, idx) => {
              const isSelected = selectedComponent?.id === comp.id;
              const isSeparator = comp.type === 'separator';

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedComponentId(comp.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(0, 212, 255, 0.08)' : isSeparator ? 'rgba(255, 107, 53, 0.08)' : 'var(--bg-elevated)',
                    boxShadow: isSelected ? '0 0 15px rgba(0, 212, 255, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>
                      {comp.type === 'noseCone' ? '🚀' :
                       comp.type === 'fairing' ? '🛡️' :
                       comp.type === 'payload' ? '🛰️' :
                       comp.type === 'propellantTank' ? '🛢️' :
                       comp.type === 'engine' ? '🔥' :
                       comp.type === 'fin' ? '📐' :
                       comp.type === 'separator' ? '⚡' : '📏'}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {comp.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {comp.type} · {(comp.parameters as any).length ? `${(comp.parameters as any).length}m` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Ordering actions */}
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-ghost"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      style={{ padding: '2px 6px', fontSize: 11, opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      ▲
                    </button>
                    <button
                      className="btn-ghost"
                      disabled={idx === activeDesign.components.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      style={{ padding: '2px 6px', fontSize: 11, opacity: idx === activeDesign.components.length - 1 ? 0.3 : 1 }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Inspector & Preflight Analytics */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ComponentInspector
            component={selectedComponent}
            onUpdateParams={(id, params) => updateComponent(id, params)}
            onDelete={(id) => {
              removeComponent(id);
              if (selectedComponentId === id) setSelectedComponentId(null);
            }}
          />
          <PreflightDashboard report={analysisReport} />
        </div>

      </div>
    </div>
  );
};
