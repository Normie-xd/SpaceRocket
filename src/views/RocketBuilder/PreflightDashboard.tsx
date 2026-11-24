import React from 'react';
import type { PreflightReport } from '../../engine/analytics/PreflightAnalysis';

interface PreflightDashboardProps {
  report: PreflightReport;
}

export const PreflightDashboard: React.FC<PreflightDashboardProps> = ({ report }) => {
  const { totalDeltaV, liftoffTWR, totalWetMass, totalDryMass, totalPropellantMass, stability, flightFeasibility } = report;

  // LEO target: ~9,200 m/s (includes ~1,500 m/s gravity & aerodynamic drag losses)
  const leoTarget = 9200;
  const deltaVPercentage = Math.min(100, (totalDeltaV / leoTarget) * 100);

  const getTwrColor = (twr: number) => {
    if (twr >= 1.2) return 'var(--accent-green)';
    if (twr >= 1.0) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const getStabilityColor = (calibers: number) => {
    if (calibers >= 1.0 && calibers <= 3.5) return 'var(--accent-green)';
    if (calibers > 0 && calibers < 1.0) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="panel-header" style={{ padding: '0 0 8px 0', borderBottom: '1px solid var(--border)' }}>
        Pre-Flight Aerospace Telemetry
      </div>

      {/* Readiness Badge */}
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          background: flightFeasibility.canLiftoff && flightFeasibility.isStable ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 51, 85, 0.15)',
          border: `1px solid ${flightFeasibility.canLiftoff && flightFeasibility.isStable ? 'var(--accent-green)' : 'var(--accent-red)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: flightFeasibility.canLiftoff && flightFeasibility.isStable ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {flightFeasibility.summary}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {flightFeasibility.isOrbitCapable ? 'LEO Ready' : 'Suborbital'}
          </span>
        </div>
        {flightFeasibility.warnings.map((w, idx) => (
          <div key={idx} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            • {w}
          </div>
        ))}
      </div>

      {/* Delta-V Gauge */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span>Total Delta-V (Δv)</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(totalDeltaV).toLocaleString()} m/s
          </span>
        </div>
        <div style={{ width: '100%', height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${deltaVPercentage}%`,
              height: '100%',
              background: deltaVPercentage >= 100 ? 'var(--accent-green)' : 'var(--accent-cyan)',
              transition: 'width 200ms ease'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          <span>0 m/s</span>
          <span>LEO Target (~9,200 m/s)</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div className="panel" style={{ padding: '8px 10px', background: 'var(--bg-elevated)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Liftoff TWR</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: getTwrColor(liftoffTWR), fontFamily: 'var(--font-mono)' }}>
            {liftoffTWR.toFixed(2)}
          </div>
        </div>
        <div className="panel" style={{ padding: '8px 10px', background: 'var(--bg-elevated)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Stability Margin</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: getStabilityColor(stability.staticMarginCalibers), fontFamily: 'var(--font-mono)' }}>
            {stability.staticMarginCalibers.toFixed(1)} cal
          </div>
        </div>
        <div className="panel" style={{ padding: '8px 10px', background: 'var(--bg-elevated)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Wet Mass</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {(totalWetMass / 1000).toFixed(1)} t
          </div>
        </div>
        <div className="panel" style={{ padding: '8px 10px', background: 'var(--bg-elevated)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Propellant Mass</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
            {(totalPropellantMass / 1000).toFixed(1)} t
          </div>
        </div>
      </div>

      {/* Stage Breakdown List */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Stage Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {report.stages.map((stg) => (
            <div
              key={stg.stageIndex}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'var(--font-mono)'
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stg.name}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({Math.round(stg.burnTime)}s burn)</span>
              </div>
              <div style={{ color: 'var(--accent-cyan)' }}>
                +{Math.round(stg.deltaV)} m/s
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
