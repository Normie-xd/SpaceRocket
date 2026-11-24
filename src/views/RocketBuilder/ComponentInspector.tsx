import React from 'react';
import type { RocketComponent } from '../../types/rocket';

interface ComponentInspectorProps {
  component: RocketComponent | null;
  onUpdateParams: (id: string, params: any) => void;
  onDelete: (id: string) => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  component,
  onUpdateParams,
  onDelete
}) => {
  if (!component) {
    return (
      <div className="panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
        Select a component from the rocket stack to inspect and edit its engineering parameters.
      </div>
    );
  }

  const p = component.parameters as any;

  const handleChange = (key: string, value: any) => {
    onUpdateParams(component.id, { [key]: value });
  };

  const handleNumChange = (key: string, valStr: string) => {
    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      handleChange(key, num);
    }
  };

  return (
    <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {component.type}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{component.name}</div>
        </div>
        <button
          className="btn-ghost"
          onClick={() => onDelete(component.id)}
          style={{ color: 'var(--accent-red)', fontSize: 12 }}
        >
          Remove
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
        {/* Dimensions */}
        {p.length !== undefined && (
          <label style={fieldStyle}>
            <span>Length (m):</span>
            <input
              type="number"
              step="0.1"
              value={p.length}
              onChange={(e) => handleNumChange('length', e.target.value)}
              style={inputStyle}
            />
          </label>
        )}

        {(p.outerDiameter !== undefined || p.baseDiameter !== undefined || p.diameter !== undefined) && (
          <label style={fieldStyle}>
            <span>Diameter (m):</span>
            <input
              type="number"
              step="0.05"
              value={p.outerDiameter ?? p.baseDiameter ?? p.diameter}
              onChange={(e) => {
                const key = p.outerDiameter !== undefined ? 'outerDiameter' : p.baseDiameter !== undefined ? 'baseDiameter' : 'diameter';
                handleNumChange(key, e.target.value);
              }}
              style={inputStyle}
            />
          </label>
        )}

        {/* Structural mass */}
        {(p.structuralMass !== undefined || p.mass !== undefined) && (
          <label style={fieldStyle}>
            <span>Dry Mass (kg):</span>
            <input
              type="number"
              step="5"
              value={p.structuralMass ?? p.mass}
              onChange={(e) => {
                const key = p.structuralMass !== undefined ? 'structuralMass' : 'mass';
                handleNumChange(key, e.target.value);
              }}
              style={inputStyle}
            />
          </label>
        )}

        {/* Propellant Tank Specifics */}
        {component.type === 'propellantTank' && (
          <>
            <label style={fieldStyle}>
              <span>Fuel Mass (kg):</span>
              <input
                type="number"
                step="50"
                value={p.propellantMass}
                onChange={(e) => handleNumChange('propellantMass', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Oxidizer Mass (kg):</span>
              <input
                type="number"
                step="50"
                value={p.oxidiserMass || 0}
                onChange={(e) => handleNumChange('oxidiserMass', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Fuel Type:</span>
              <select
                value={p.propellantType}
                onChange={(e) => handleChange('propellantType', e.target.value)}
                style={inputStyle}
              >
                <option value="RP1">RP-1 (Kerosene)</option>
                <option value="LH2">LH2 (Liquid Hydrogen)</option>
                <option value="LCH4">LCH4 (Liquid Methane)</option>
                <option value="solidAPCTHB">Solid APCP</option>
              </select>
            </label>
          </>
        )}

        {/* Engine Specifics */}
        {component.type === 'engine' && (
          <>
            <label style={fieldStyle}>
              <span>Quantity (Cluster):</span>
              <input
                type="number"
                min="1"
                max="33"
                value={p.quantity || 1}
                onChange={(e) => handleNumChange('quantity', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>SL Thrust (N):</span>
              <input
                type="number"
                step="5000"
                value={p.thrustSeaLevel}
                onChange={(e) => handleNumChange('thrustSeaLevel', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Vac Thrust (N):</span>
              <input
                type="number"
                step="5000"
                value={p.thrustVacuum}
                onChange={(e) => handleNumChange('thrustVacuum', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Vac Isp (s):</span>
              <input
                type="number"
                step="5"
                value={p.ispVacuum}
                onChange={(e) => handleNumChange('ispVacuum', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Gimbal Range (deg):</span>
              <input
                type="number"
                step="1"
                value={p.gimbalRange || 0}
                onChange={(e) => handleNumChange('gimbalRange', e.target.value)}
                style={inputStyle}
              />
            </label>
          </>
        )}

        {/* Fin Specifics */}
        {component.type === 'fin' && (
          <>
            <label style={fieldStyle}>
              <span>Fin Count:</span>
              <input
                type="number"
                min="2"
                max="8"
                value={p.quantity || 4}
                onChange={(e) => handleNumChange('quantity', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Span (m):</span>
              <input
                type="number"
                step="0.05"
                value={p.span}
                onChange={(e) => handleNumChange('span', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Root Chord (m):</span>
              <input
                type="number"
                step="0.05"
                value={p.rootChord}
                onChange={(e) => handleNumChange('rootChord', e.target.value)}
                style={inputStyle}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8
};

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text-primary)',
  padding: '4px 8px',
  fontSize: 13,
  width: '50%',
  textAlign: 'right'
};
