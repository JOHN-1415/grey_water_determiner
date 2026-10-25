import React from 'react';
import { Filter, Check, AlertCircle, ArrowRight, CornerDownRight, Power, Layers } from 'lucide-react';

export default function FiltrationPipelineVisualizer({
  assessment,
  treatment,
  sourceMode
}) {
  const recommendedLevel = assessment?.treatment_level || 'UNKNOWN';
  
  // Hardware reported stage statuses
  const activeStage = treatment?.active_stage;
  const stage1Status = treatment?.stage_1 || 'UNKNOWN';
  const stage2Status = treatment?.stage_2 || 'UNKNOWN';
  const stage3Status = treatment?.stage_3 || 'UNKNOWN';
  const pumpStatus = treatment?.pump_status || 'UNKNOWN';

  // Recommended stage target
  const recommendedStages = {
    BASIC: { s1: 'ACTIVE', s2: 'BYPASSED', s3: 'BYPASSED' },
    MEDIUM: { s1: 'ACTIVE', s2: 'ACTIVE', s3: 'BYPASSED' },
    HIGH: { s1: 'ACTIVE', s2: 'ACTIVE', s3: 'ACTIVE' },
    UNKNOWN: { s1: 'BYPASSED', s2: 'BYPASSED', s3: 'BYPASSED' }
  }[recommendedLevel] || { s1: 'BYPASSED', s2: 'BYPASSED', s3: 'BYPASSED' };

  // Detect mismatch between recommended level and hardware active stage
  const expectedStageNum = recommendedLevel === 'BASIC' ? 1 : recommendedLevel === 'MEDIUM' ? 2 : recommendedLevel === 'HIGH' ? 3 : null;
  const isMismatch = activeStage !== null && expectedStageNum !== null && activeStage !== expectedStageNum;
  const hasHardwareFault = stage1Status === 'FAULT' || stage2Status === 'FAULT' || stage3Status === 'FAULT';

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }} id="filtration-pipeline-container">
      
      {/* Title & Controller Relay Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#38bdf8" />
            Adaptive Multi-Stage Filtration Pipeline
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Physical routing controlled via ESP32 Relay Modules (Sediment → Carbon → Fine Module)
          </p>
        </div>

        {/* Pump / Actuator Telemetry Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 14px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <Power size={14} color={pumpStatus === 'ON' ? '#10b981' : '#94a3b8'} />
            <span style={{ color: 'var(--text-muted)' }}>PUMP RELAY:</span>
            <span style={{ fontWeight: '700', color: pumpStatus === 'ON' ? '#34d399' : '#f87171' }}>
              {pumpStatus}
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />

          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>ACTIVE STAGE: </span>
            <span style={{ fontWeight: '700', color: '#38bdf8' }}>
              {activeStage !== null && activeStage !== undefined ? `Stage ${activeStage}` : 'Standby / None'}
            </span>
          </div>
        </div>
      </div>

      {/* Mismatch Warning Alert if any */}
      {(isMismatch || hasHardwareFault) && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }} id="stage-mismatch-banner">
          <AlertCircle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.825rem', color: '#fef3c7', lineHeight: '1.5' }}>
            <strong>Stage Discrepancy / Hardware Anomaly Detected:</strong> The rules engine recommends{' '}
            <strong>{recommendedLevel} (Stage {expectedStageNum})</strong>, but hardware reports Active Stage{' '}
            <strong>{activeStage || 'None'}</strong>
            {hasHardwareFault && ' with a valve/relay FAULT'}. Verify solenoid valves and relay wiring.
          </div>
        </div>
      )}

      {/* 3-Stage Schematic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        position: 'relative'
      }}>
        
        {/* Stage 1: Physical Sediment Filter */}
        <div style={{
          padding: '18px',
          borderRadius: '14px',
          background: recommendedStages.s1 === 'ACTIVE' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(15, 23, 42, 0.6)',
          border: `1px solid ${recommendedStages.s1 === 'ACTIVE' ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-subtle)'}`,
          boxShadow: recommendedStages.s1 === 'ACTIVE' ? '0 0 15px rgba(6, 182, 212, 0.15)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.05em' }}>
              STAGE 01
            </span>
            <span className={`badge ${
              stage1Status === 'ACTIVE' ? 'badge-hardware' :
              stage1Status === 'COMPLETED' ? 'level-basic' : 'level-unknown'
            }`} style={{ fontSize: '0.7rem' }}>
              HW: {stage1Status}
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
            Physical Sediment Filter
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            5–10 micron mesh trapping hair, lint, and coarse suspended solids.
          </p>

          <div style={{
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.25)',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Recommended:</span>
              <strong style={{ color: '#34d399' }}>{recommendedStages.s1}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Hardware Reported:</span>
              <strong style={{ color: stage1Status === 'ACTIVE' ? '#38bdf8' : '#cbd5e1' }}>{stage1Status}</strong>
            </div>
          </div>
        </div>

        {/* Stage 2: Activated Carbon Adsorption */}
        <div style={{
          padding: '18px',
          borderRadius: '14px',
          background: recommendedStages.s2 === 'ACTIVE' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.6)',
          border: `1px solid ${recommendedStages.s2 === 'ACTIVE' ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-subtle)'}`,
          boxShadow: recommendedStages.s2 === 'ACTIVE' ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa', letterSpacing: '0.05em' }}>
              STAGE 02
            </span>
            <span className={`badge ${
              stage2Status === 'ACTIVE' ? 'badge-hardware' :
              stage2Status === 'COMPLETED' ? 'level-basic' :
              stage2Status === 'FAULT' ? 'badge-error' : 'level-unknown'
            }`} style={{ fontSize: '0.7rem' }}>
              HW: {stage2Status}
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
            Activated Carbon Bed
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Adsorbs surfactants, soap compounds, chlorine, and reduces odors & organic TDS.
          </p>

          <div style={{
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.25)',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Recommended:</span>
              <strong style={{ color: recommendedStages.s2 === 'ACTIVE' ? '#38bdf8' : '#94a3b8' }}>
                {recommendedStages.s2}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Hardware Reported:</span>
              <strong style={{ color: stage2Status === 'ACTIVE' ? '#38bdf8' : stage2Status === 'FAULT' ? '#f43f5e' : '#cbd5e1' }}>
                {stage2Status}
              </strong>
            </div>
          </div>
        </div>

        {/* Stage 3: Fine Filtration Module */}
        <div style={{
          padding: '18px',
          borderRadius: '14px',
          background: recommendedStages.s3 === 'ACTIVE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(15, 23, 42, 0.6)',
          border: `1px solid ${recommendedStages.s3 === 'ACTIVE' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
          boxShadow: recommendedStages.s3 === 'ACTIVE' ? '0 0 15px rgba(245, 158, 11, 0.15)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fbbf24', letterSpacing: '0.05em' }}>
              STAGE 03 (PROVISIONAL)
            </span>
            <span className={`badge ${
              stage3Status === 'ACTIVE' ? 'badge-hardware' :
              stage3Status === 'COMPLETED' ? 'level-basic' : 'level-unknown'
            }`} style={{ fontSize: '0.7rem' }}>
              HW: {stage3Status}
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
            Fine / Microfiltration Module
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Intensive polishing module for heavy turbidity greywater (Pending shop confirmation).
          </p>

          <div style={{
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.25)',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Recommended:</span>
              <strong style={{ color: recommendedStages.s3 === 'ACTIVE' ? '#fbbf24' : '#94a3b8' }}>
                {recommendedStages.s3}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Hardware Reported:</span>
              <strong style={{ color: stage3Status === 'ACTIVE' ? '#fbbf24' : '#cbd5e1' }}>{stage3Status}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Distinction Note */}
      <div style={{ marginTop: '16px', fontSize: '0.775rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
        <em>Architecture Note:</em> Recommendations are derived from measured incoming sensor thresholds. Hardware status reflects local relay positions sent in telemetry by the ESP32.
      </div>

    </div>
  );
}
