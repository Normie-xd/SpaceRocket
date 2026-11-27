import React, { useState } from 'react';
import { REAL_WORLD_ENGINES, type EngineSpec } from './docsData';

export const EngineCatalogView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filtered = REAL_WORLD_ENGINES.filter((eng) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'kerosene' && eng.propellants.includes('RP-1')) ||
      (filter === 'methane' && eng.propellants.includes('Methane')) ||
      (filter === 'hydrogen' && eng.propellants.includes('Hydrogen'));

    const matchesSearch =
      eng.name.toLowerCase().includes(search.toLowerCase()) ||
      eng.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      eng.manufacturer.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)' }}>
            Real-World Rocket Engine Specification Library
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Empirical engineering specifications for flight-proven orbital propulsion systems.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Search engines, vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              fontSize: 12
            }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '6px 10px',
              fontSize: 12
            }}
          >
            <option value="all">All Propellants</option>
            <option value="kerosene">RP-1 / LOX</option>
            <option value="methane">Methane / LOX</option>
            <option value="hydrogen">LH2 / LOX</option>
          </select>
        </div>
      </div>

      {/* Engine Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {filtered.map((eng: EngineSpec) => (
          <div
            key={eng.id}
            className="panel"
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>{eng.name}</span>
                <span style={{ fontSize: 11, color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
                  TWR {eng.twrVacuum}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {eng.manufacturer} · {eng.vehicle}
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {eng.description}
            </p>

            {/* Spec Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Vac Thrust: </span>
                <span style={{ fontWeight: 600 }}>{eng.thrustVacuumKn.toLocaleString()} kN</span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Vac Isp: </span>
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{eng.ispVacuumSec} s</span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Chamber P: </span>
                <span style={{ fontWeight: 600 }}>{eng.chamberPressureBar} bar</span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Dry Mass: </span>
                <span style={{ fontWeight: 600 }}>{eng.massKg.toLocaleString()} kg</span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <strong>Propellants:</strong> {eng.propellants} ({eng.cycle})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
