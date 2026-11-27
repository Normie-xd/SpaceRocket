import React from 'react';
import {
  useSettingsStore,
  type UnitSystem,
  type SimulationFidelity,
  type GraphicsQuality
} from '../store/settingsStore';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    unitSystem,
    simulationFidelity,
    graphicsQuality,
    enableAtmosphericScattering,
    enableVolumetricExhaust,
    enableShadows,
    enableThermalModeling,
    showTrajectoryArc,
    setUnitSystem,
    setSimulationFidelity,
    setGraphicsQuality,
    toggleSetting
  } = useSettingsStore();

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div className="panel" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>
            ⚙️ SpaceRocket Settings
          </h2>
          <button className="btn-ghost" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
          <SettingRow label="Unit System">
            <select
              value={unitSystem}
              onChange={(e) => setUnitSystem(e.target.value as UnitSystem)}
              style={selectStyle}
            >
              <option value="metric">Metric (SI — m, km, kg, N, Pa)</option>
              <option value="imperial">Imperial (US — ft, mi, lbs, lbf, psi)</option>
            </select>
          </SettingRow>

          <SettingRow label="Simulation Physics Fidelity">
            <select
              value={simulationFidelity}
              onChange={(e) => setSimulationFidelity(e.target.value as SimulationFidelity)}
              style={selectStyle}
            >
              <option value="standard">Standard (50 Hz RK4)</option>
              <option value="high">High Fidelity (200 Hz RK4)</option>
            </select>
          </SettingRow>

          <SettingRow label="3D Graphics Quality">
            <select
              value={graphicsQuality}
              onChange={(e) => setGraphicsQuality(e.target.value as GraphicsQuality)}
              style={selectStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra (Full Shaders)</option>
            </select>
          </SettingRow>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ToggleRow
              label="Rayleigh Atmospheric Scattering Shader"
              checked={enableAtmosphericScattering}
              onChange={() => toggleSetting('enableAtmosphericScattering')}
            />
            <ToggleRow
              label="Volumetric Exhaust Plume & Vacuum Bloom"
              checked={enableVolumetricExhaust}
              onChange={() => toggleSetting('enableVolumetricExhaust')}
            />
            <ToggleRow
              label="Aerodynamic Thermal Heating Modeling"
              checked={enableThermalModeling}
              onChange={() => toggleSetting('enableThermalModeling')}
            />
            <ToggleRow
              label="3D Orbital Trajectory Arc"
              checked={showTrajectoryArc}
              onChange={() => toggleSetting('showTrajectoryArc')}
            />
            <ToggleRow
              label="Real-Time Dynamic Shadows"
              checked={enableShadows}
              onChange={() => toggleSetting('enableShadows')}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Flight Keyboard Shortcuts
            </div>
            <div>`Space` — Pause / Resume · `G` — Stage Vehicle · `1`–`6` — Time Scale (1×–32×)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    {children}
  </div>
);

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({
  label,
  checked,
  onChange
}) => (
  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: 'var(--accent-cyan)' }} />
  </label>
);

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 5, 10, 0.75)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100
};

const modalStyle: React.CSSProperties = {
  width: 480,
  padding: 24,
  background: 'var(--bg-panel)',
  border: '1px solid var(--border-bright)'
};

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text-primary)',
  padding: '6px 10px',
  fontSize: 12
};
