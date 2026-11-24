import React from 'react';
import type { RocketComponent } from '../../types/rocket';

interface ComponentPaletteProps {
  onAddComponent: (comp: RocketComponent) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const handleAdd = (type: RocketComponent['type']) => {
    const id = crypto.randomUUID();
    let comp: RocketComponent;

    switch (type) {
      case 'noseCone':
        comp = {
          id,
          type: 'noseCone',
          name: 'Aerodynamic Nose Cone',
          parameters: {
            shape: 'ogive',
            length: 2.0,
            baseDiameter: 1.0,
            wallThickness: 0.003,
            material: 'carbonFibreComposite',
            mass: 25.0
          }
        };
        break;

      case 'bodyTube':
        comp = {
          id,
          type: 'bodyTube',
          name: 'Structural Interstage Tube',
          parameters: {
            length: 3.0,
            outerDiameter: 1.0,
            wallThickness: 0.003,
            material: 'aluminiumAlloy',
            mass: 80.0
          }
        };
        break;

      case 'propellantTank':
        comp = {
          id,
          type: 'propellantTank',
          name: 'Liquid Propellant Tank',
          parameters: {
            length: 6.0,
            outerDiameter: 1.0,
            wallThickness: 0.004,
            material: 'aluminiumAlloy',
            structuralMass: 350.0,
            propellantType: 'RP1',
            oxidiserType: 'LOX',
            propellantMass: 1500.0,
            oxidiserMass: 3500.0,
            mixtureRatio: 2.33,
            ullagePercent: 4,
            pressurisation: 'regulated',
            operatingPressure: 3_500_000
          }
        };
        break;

      case 'engine':
        comp = {
          id,
          type: 'engine',
          name: 'Liquid Rocket Engine',
          parameters: {
            thrustSeaLevel: 120_000,
            thrustVacuum: 135_000,
            ispSeaLevel: 280,
            ispVacuum: 310,
            nozzleExitDiameter: 0.45,
            nozzleThroatDiameter: 0.09,
            expansionRatio: 25,
            gimbalRange: 5,
            mass: 140.0,
            burnTime: 120,
            restartable: true,
            quantity: 1,
            propellantType: 'RP1',
            oxidiserType: 'LOX',
            cycleType: 'gasGenerator',
            chamberPressure: 7_000_000
          }
        };
        break;

      case 'fin':
        comp = {
          id,
          type: 'fin',
          name: 'Stabilizing Fin Set (x4)',
          parameters: {
            shape: 'trapezoidal',
            quantity: 4,
            rootChord: 0.8,
            tipChord: 0.3,
            span: 0.4,
            sweepAngle: 30,
            thickness: 0.008,
            material: 'aluminiumAlloy',
            mass: 18.0,
            attachPosition: 8.5
          }
        };
        break;

      case 'fairing':
        comp = {
          id,
          type: 'fairing',
          name: 'Payload Fairing Halves',
          parameters: {
            length: 4.0,
            diameter: 1.2,
            wallThickness: 0.003,
            material: 'carbonFibreComposite',
            mass: 120.0,
            jettisionAltitude: 100_000,
            separationVelocity: 3.0
          }
        };
        break;

      case 'payload':
        comp = {
          id,
          type: 'payload',
          name: 'Scientific Satellite',
          parameters: {
            mass: 200.0,
            length: 1.5,
            diameter: 0.8,
            description: 'Scientific instrument payload'
          }
        };
        break;

      case 'separator':
        comp = {
          id,
          type: 'separator',
          name: 'Interstage Separation Ring',
          parameters: {
            mass: 45.0,
            separationImpulse: 5000,
            stageNumber: 0
          }
        };
        break;
    }

    onAddComponent(comp);
  };

  const paletteItems = [
    { type: 'noseCone', icon: '🚀', label: 'Nose Cone', desc: 'Aerodynamic tip' },
    { type: 'fairing', icon: '🛡️', label: 'Fairing', desc: 'Protective payload shell' },
    { type: 'payload', icon: '🛰️', label: 'Payload', desc: 'Satellite / cargo' },
    { type: 'propellantTank', icon: '🛢️', label: 'Propellant Tank', desc: 'Fuel & oxidizer storage' },
    { type: 'engine', icon: '🔥', label: 'Engine Cluster', desc: 'Propulsion motor' },
    { type: 'fin', icon: '📐', label: 'Fins', desc: 'Passive stability surfaces' },
    { type: 'separator', icon: '⚡', label: 'Separator', desc: 'Multi-stage split ring' },
    { type: 'bodyTube', icon: '📏', label: 'Body Tube', desc: 'Structural interstage' }
  ] as const;

  return (
    <div className="panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="panel-header" style={{ padding: '0 0 8px 0', borderBottom: '1px solid var(--border)' }}>
        Component Palette
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {paletteItems.map((item) => (
          <button
            key={item.type}
            className="btn-secondary"
            onClick={() => handleAdd(item.type)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px 6px',
              fontSize: 12,
              gap: 4
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
