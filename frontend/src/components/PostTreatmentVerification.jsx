import React from 'react';
import { ArrowDownRight, CheckCircle2, AlertCircle, Info, SplitSquareVertical } from 'lucide-react';

export default function PostTreatmentVerification({
  inputSensors,
  outputSensors
}) {
  const hasOutputSensors = Boolean(
    outputSensors &&
    (outputSensors.tds_ppm !== null && outputSensors.tds_ppm !== undefined ||
     outputSensors.turbidity_ntu !== null && outputSensors.turbidity_ntu !== undefined)
  );

  if (!hasOutputSensors) {
    return (
      <div className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '20px',
        borderLeft: '4px solid #64748b',
        background: 'rgba(30, 41, 59, 0.4)'
      }} id="post-treatment-unavailable-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} color="#94a3b8" />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#e2e8f0' }}>
                Post-Treatment Sensor Verification: Not Installed
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Hardware prototype contains only intake sensors. Output quality cannot be measured directly without secondary probe setup.
              </div>
            </div>
          </div>
          <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', fontSize: '0.7rem' }}>
            Output Probes Omitted
          </span>
        </div>
      </div>
    );
  }

  // Calculate percentage reduction
  const inTds = Number(inputSensors?.tds_ppm) || 0;
  const outTds = Number(outputSensors?.tds_ppm) || 0;
  const tdsReduction = inTds > 0 ? Math.max(0, Math.round(((inTds - outTds) / inTds) * 100)) : 0;

  const inTurb = Number(inputSensors?.turbidity_ntu) || 0;
  const outTurb = Number(outputSensors?.turbidity_ntu) || 0;
  const turbReduction = inTurb > 0 ? Math.max(0, Math.round(((inTurb - outTurb) / inTurb) * 100)) : 0;

  return (
    <div className="glass-panel" style={{
      padding: '20px',
      marginBottom: '20px',
      borderLeft: '4px solid #10b981',
      background: 'rgba(16, 185, 129, 0.06)'
    }} id="post-treatment-available-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#34d399" />
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#f8fafc' }}>
            Post-Treatment Efficacy Verification (Dual-Sensor Hardware Mode)
          </h3>
          <span className="badge badge-hardware" style={{ fontSize: '0.7rem' }}>
            Output Verified
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
          Comparing incoming raw water vs filtered effluent
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        
        {/* Turbidity Comparison */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
            TURBIDITY CLEARING
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
              {inTurb.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>→</span> <strong style={{ color: '#34d399' }}>{outTurb.toFixed(1)}</strong>
            </span>
            <span className="badge level-basic" style={{ fontSize: '0.7rem' }}>
              ↓ {turbReduction}% Removed
            </span>
          </div>
        </div>

        {/* TDS Reduction */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
            TDS / SOLIDS ADSORPTION
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
              {inTds.toFixed(0)} <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>→</span> <strong style={{ color: '#34d399' }}>{outTds.toFixed(0)}</strong>
            </span>
            <span className="badge level-basic" style={{ fontSize: '0.7rem' }}>
              ↓ {tdsReduction}% Removed
            </span>
          </div>
        </div>

        {/* Temperature Delta */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
            TEMPERATURE STABILITY
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
              {inputSensors?.temperature_c ? Number(inputSensors.temperature_c).toFixed(1) : '--'}°C
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}> → </span>
              <strong style={{ color: '#38bdf8' }}>{outputSensors?.temperature_c ? Number(outputSensors.temperature_c).toFixed(1) : '--'}°C</strong>
            </span>
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', fontSize: '0.7rem' }}>
              Thermal Loss: {((inputSensors?.temperature_c || 0) - (outputSensors?.temperature_c || 0)).toFixed(1)}°C
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
