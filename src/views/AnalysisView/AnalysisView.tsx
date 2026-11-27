import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useSimulationStore } from '../../store/simulationStore';
import {
  computePostFlightSummary,
  telemetryToCSV,
  telemetryToJSON,
  saveTelemetryExport,
  generateSampleFlightTelemetry
} from './telemetryExport';
import type { TelemetryFrame, SimulationEvent } from '../../types/simulation';

interface AnalysisViewProps {
  onBack: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ onBack }) => {
  const { telemetry, events } = useSimulationStore();
  const [sampleData, setSampleData] = useState<{ frames: TelemetryFrame[]; events: SimulationEvent[] } | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const activeFrames = telemetry.length > 0 ? telemetry : (sampleData?.frames || []);
  const activeEvents = telemetry.length > 0 ? events : (sampleData?.events || []);

  const summary = useMemo(() => computePostFlightSummary(activeFrames), [activeFrames]);

  // Downsample chart points for snappy 60fps rendering if > 300 frames
  const chartData = useMemo(() => {
    if (activeFrames.length === 0) return [];
    const stride = Math.max(1, Math.floor(activeFrames.length / 250));
    return activeFrames
      .filter((_, idx) => idx % stride === 0 || idx === activeFrames.length - 1)
      .map((f) => ({
        time: Number(f.timestamp.toFixed(1)),
        altitudeKm: Number((f.altitude / 1000).toFixed(2)),
        downrangeKm: Number((f.downrange / 1000).toFixed(2)),
        speedMps: Number(f.speed.toFixed(1)),
        mach: Number(f.mach.toFixed(2)),
        qKpa: Number((f.dynamicPressure / 1000).toFixed(2)),
        gForce: Number(f.gForce.toFixed(2)),
        thrustKn: Number((f.thrust / 1000).toFixed(1)),
        massTons: Number((f.totalMass / 1000).toFixed(1))
      }));
  }, [activeFrames]);

  const handleExportCSV = async () => {
    const csv = telemetryToCSV(activeFrames);
    const res = await saveTelemetryExport(`spacerocket-telemetry-${Date.now()}.csv`, csv, 'text/csv');
    setExportStatus(res.path ? `Saved CSV to ${res.path}` : 'CSV downloaded');
  };

  const handleExportJSON = async () => {
    const json = telemetryToJSON(activeFrames, activeEvents);
    const res = await saveTelemetryExport(`spacerocket-mission-${Date.now()}.json`, json, 'application/json');
    setExportStatus(res.path ? `Saved JSON to ${res.path}` : 'JSON downloaded');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Top Header */}
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
          <button className="btn-ghost" onClick={onBack}>
            ← Main Menu
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)' }}>
              Post-Flight Telemetry Analysis
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {exportStatus && (
            <span style={{ fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              {exportStatus}
            </span>
          )}
          <button
            className="btn-secondary"
            disabled={activeFrames.length === 0}
            onClick={handleExportCSV}
            style={{ padding: '6px 14px', fontSize: 12, opacity: activeFrames.length === 0 ? 0.4 : 1 }}
          >
            Export CSV
          </button>
          <button
            className="btn-primary"
            disabled={activeFrames.length === 0}
            onClick={handleExportJSON}
            style={{ padding: '6px 14px', fontSize: 12, opacity: activeFrames.length === 0 ? 0.4 : 1 }}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Content */}
      {activeFrames.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 40
          }}
        >
          <div style={{ fontSize: 40 }}>🛰️</div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>No Flight Telemetry Recorded Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 460, textAlign: 'center', fontSize: 13 }}>
            Launch a rocket in the 3D Simulation view to stream live flight data here, or load a sample two-stage orbital flight profile to explore the telemetry charts.
          </p>
          <button
            className="btn-primary"
            onClick={() => setSampleData(generateSampleFlightTelemetry())}
          >
            Load Sample Orbital Flight Telemetry
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            <KpiCard label="Flight Duration" value={`${summary.durationSeconds.toFixed(1)} s`} accent="var(--text-primary)" />
            <KpiCard label="Peak Altitude" value={`${(summary.maxAltitudeMeters / 1000).toFixed(2)} km`} accent="var(--accent-cyan)" />
            <KpiCard label="Max Velocity" value={`${Math.round(summary.maxSpeedMps).toLocaleString()} m/s`} accent="var(--accent-green)" />
            <KpiCard label="Peak Mach" value={`M ${summary.maxMach.toFixed(2)}`} accent="var(--accent-orange)" />
            <KpiCard label="Max-Q" value={`${(summary.maxDynamicPressurePa / 1000).toFixed(1)} kPa`} accent="var(--accent-yellow)" />
            <KpiCard label="Peak Load" value={`${summary.maxGForce.toFixed(2)} G`} accent="var(--accent-purple)" />
          </div>

          {/* 2x2 Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <ChartCard title="Altitude (km) & Downrange (km) vs Time (s)">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                  <XAxis dataKey="time" stroke="#8888aa" fontSize={11} />
                  <YAxis stroke="#8888aa" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="altitudeKm" name="Altitude (km)" stroke="#00d4ff" fill="#00d4ff22" />
                  <Area type="monotone" dataKey="downrangeKm" name="Downrange (km)" stroke="#00ff88" fill="#00ff8811" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Inertial Velocity (m/s) & Mach Number vs Time (s)">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                  <XAxis dataKey="time" stroke="#8888aa" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#00ff88" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ff6b35" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="speedMps" name="Speed (m/s)" stroke="#00ff88" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="mach" name="Mach" stroke="#ff6b35" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Dynamic Pressure Max-Q (kPa) & Axial G-Force">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                  <XAxis dataKey="time" stroke="#8888aa" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#ffd700" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9d4edd" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="qKpa" name="Dynamic Pressure (kPa)" stroke="#ffd700" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="gForce" name="Load (G)" stroke="#9d4edd" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Thrust Output (kN) & Vehicle Mass (t)">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                  <XAxis dataKey="time" stroke="#8888aa" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#ff6b35" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#00d4ff" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="thrustKn" name="Thrust (kN)" stroke="#ff6b35" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="massTons" name="Mass (t)" stroke="#00d4ff" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Mission Event Timeline */}
          <div className="panel" style={{ padding: 16 }}>
            <div className="panel-header" style={{ padding: '0 0 10px 0', marginBottom: 10 }}>
              Mission Event Log ({activeEvents.length} events · {summary.sampleCount} telemetry frames)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {activeEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <span style={{ color: 'var(--accent-cyan)' }}>T+{ev.timestamp.toFixed(1)}s</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
                  <span>{ev.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div className="panel" style={{ padding: '10px 14px', background: 'var(--bg-panel)' }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {label}
    </div>
    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: accent, marginTop: 4 }}>
      {value}
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="panel" style={{ padding: 14, background: 'var(--bg-panel)' }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#0f0f1a',
  border: '1px solid #2e2e5f',
  borderRadius: 6,
  fontSize: 11
};
