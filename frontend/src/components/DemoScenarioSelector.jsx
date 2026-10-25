import React from 'react';
import { Play, Sparkles, AlertCircle, Info } from 'lucide-react';
import { SCENARIO_PRESETS } from '../services/dataProvider';

export default function DemoScenarioSelector({
  activeScenarioId,
  onSelectScenario,
  isSimulated
}) {
  if (!isSimulated) {
    return (
      <div className="glass-panel" style={{
        padding: '12px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeft: '4px solid #10b981',
        background: 'rgba(16, 185, 129, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={18} color="#34d399" />
          <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>
            <strong>ESP32 Hardware Mode Active:</strong> Dashboard is polling the backend REST API for live telemetry from device <code>GW-001</code>.
          </span>
        </div>
        <span className="badge badge-hardware">Live Telemetry</span>
      </div>
    );
  }

  const currentScenario = SCENARIO_PRESETS.find((s) => s.id === Number(activeScenarioId)) || SCENARIO_PRESETS[0];

  return (
    <div className="glass-panel" style={{
      padding: '16px 20px',
      marginBottom: '20px',
      borderLeft: '4px solid #f59e0b',
      background: 'rgba(245, 158, 11, 0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#fbbf24" />
          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fef3c7' }}>
            Demo Evaluation Testbed (10 Test Scenarios)
          </span>
          <span className="badge badge-simulated">Demo Mode</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Reproducible deterministic test states for project review & hardware validation
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <label htmlFor="scenario-select" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          Select Scenario:
        </label>
        
        <select
          id="scenario-select"
          value={activeScenarioId}
          onChange={(e) => onSelectScenario(Number(e.target.value))}
          style={{
            flex: '1',
            minWidth: '280px',
            maxWidth: '520px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          {SCENARIO_PRESETS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>

        <div style={{
          flex: '2',
          minWidth: '240px',
          padding: '6px 12px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.825rem',
          color: '#cbd5e1'
        }}>
          <strong>Target:</strong> {currentScenario.desc}
        </div>
      </div>
    </div>
  );
}
