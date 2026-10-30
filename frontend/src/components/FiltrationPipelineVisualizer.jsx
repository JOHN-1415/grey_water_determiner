import React from 'react';
import { Filter, Check, AlertTriangle, AlertCircle, CheckCircle2, Power, Layers } from 'lucide-react';

export default function FiltrationPipelineVisualizer({
  assessment,
  treatment,
  sourceMode
}) {
  const recommendedLevel = assessment?.treatment_level || 'UNKNOWN';
  const pumpStatus = treatment?.pump_status || 'UNKNOWN';
  const isPumpOn = pumpStatus === 'ON';

  // Check if assessed requirement exceeds the single-stage physical prototype
  const exceedsPhysicalCapability = recommendedLevel === 'MEDIUM' || recommendedLevel === 'HIGH';
  const meetsCapability = recommendedLevel === 'BASIC';

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }} id="filtration-pipeline-container">
      
      {/* Title & Real Pump Relay Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Layers size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc' }}>
              Adaptive Filtration Pipeline & Physical Prototype Status
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Physical Prototype Capability: <strong style={{ color: '#38bdf8' }}>Stage 1 Basic Physical Filtration ONLY</strong> (Relay GPIO 25)
          </p>
        </div>

        {/* Real Hardware Pump Relay Pill */}
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
            <Power size={14} color={isPumpOn ? '#10b981' : '#94a3b8'} />
            <span style={{ color: 'var(--text-muted)' }}>PUMP RELAY (GPIO 25):</span>
            <span style={{ fontWeight: '700', color: isPumpOn ? '#34d399' : '#f87171' }}>
              {pumpStatus}
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />

          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>PHYSICAL HARDWARE: </span>
            <span style={{ fontWeight: '700', color: '#38bdf8' }}>
              Stage 1 Only
            </span>
          </div>
        </div>
      </div>

      {/* Capability Warning / Match Notice */}
      {exceedsPhysicalCapability ? (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }} id="capability-exceeded-banner">
          <AlertTriangle size={22} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fef3c7', marginBottom: '2px' }}>
              Assessed Treatment Requirement Exceeds Physical Prototype Capability
            </div>
            <div style={{ fontSize: '0.825rem', color: '#fde68a', lineHeight: '1.5' }}>
              The software rules engine classified incoming water as requiring <strong>{recommendedLevel} TREATMENT</strong> (due to elevated Turbidity or TDS).
              The current physical hardware prototype is equipped with <strong>Stage 1 Basic Physical Filtration only</strong>.
              Stage 2 (Activated Carbon) and Stage 3 (Fine Module) are software assessment recommendations only and are <strong>not physically installed</strong> on this testbed.
            </div>
          </div>
        </div>
      ) : meetsCapability ? (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }} id="capability-matched-banner">
          <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: '#a7f3d0', lineHeight: '1.4' }}>
            <strong>Physical Prototype Capability Matched:</strong> Incoming water quality satisfies basic criteria (Turbidity ≤ 5.0 NTU, TDS ≤ 300 ppm).
            The installed physical Stage 1 sediment filtration module is sufficient.
          </div>
        </div>
      ) : (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(148, 163, 184, 0.1)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="#94a3b8" />
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            Telemetry status UNKNOWN: Safe hold engaged. Lowest treatment is not assumed.
          </div>
        </div>
      )}

      {/* 3-Stage Schematic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        position: 'relative'
      }}>
        
        {/* Stage 1: Physical Sediment Filter (INSTALLED ON HARDWARE) */}
        <div style={{
          padding: '18px',
          borderRadius: '14px',
          background: isPumpOn ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
          border: `1px solid ${isPumpOn ? 'rgba(6, 182, 212, 0.5)' : 'var(--border-subtle)'}`,
          boxShadow: isPumpOn ? '0 0 16px rgba(6, 182, 212, 0.25)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.05em' }}>
              STAGE 01
            </span>
            <span className="badge level-basic" style={{ fontSize: '0.65rem' }}>
              PHYSICALLY INSTALLED
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px', color: '#f8fafc' }}>
            Physical Sediment Filter
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Physical mesh filter driven by the 12V/5V DC pump relay on <strong>GPIO 25</strong>.
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
              <span style={{ color: 'var(--text-subtle)' }}>Hardware Status:</span>
              <strong style={{ color: isPumpOn ? '#34d399' : '#cbd5e1' }}>
                {isPumpOn ? 'PUMP ACTIVE (FILTERING)' : 'PUMP STANDBY'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Physical Relay:</span>
              <strong style={{ color: '#38bdf8' }}>GPIO 25 (Ch 1)</strong>
            </div>
          </div>
        </div>

        {/* Stage 2: Activated Carbon Bed (SOFTWARE ONLY - NOT INSTALLED) */}
        <div style={{
          padding: '18px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed rgba(245, 158, 11, 0.3)',
          opacity: 0.9
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>
              STAGE 02 (CARBON)
            </span>
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.65rem' }}>
              NOT PHYSICALLY INSTALLED
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px', color: '#cbd5e1' }}>
            Activated Carbon Adsorption
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Software recommendation for soap and surfactant removal. No physical relay or valve installed.
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
              <span style={{ color: 'var(--text-subtle)' }}>Software Recommendation:</span>
              <strong style={{ color: recommendedLevel === 'MEDIUM' || recommendedLevel === 'HIGH' ? '#fbbf24' : '#94a3b8' }}>
                {recommendedLevel === 'MEDIUM' || recommendedLevel === 'HIGH' ? 'REQUIRED UPGRADE' : 'NOT REQUIRED'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Hardware Status:</span>
              <strong style={{ color: '#94a3b8' }}>NONE (Software only)</strong>
            </div>
          </div>
        </div>

        {/* Stage 3: Fine Filtration Module (SOFTWARE ONLY - NOT INSTALLED) */}
        <div style={{
          padding: '18px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed rgba(239, 68, 68, 0.3)',
          opacity: 0.9
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>
              STAGE 03 (FINE MODULE)
            </span>
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.65rem' }}>
              NOT PHYSICALLY INSTALLED
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px', color: '#cbd5e1' }}>
            Fine / Microfiltration Module
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Software recommendation for heavy laundry greywater. No physical module or valve installed.
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
              <span style={{ color: 'var(--text-subtle)' }}>Software Recommendation:</span>
              <strong style={{ color: recommendedLevel === 'HIGH' ? '#f87171' : '#94a3b8' }}>
                {recommendedLevel === 'HIGH' ? 'REQUIRED UPGRADE' : 'NOT REQUIRED'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Hardware Status:</span>
              <strong style={{ color: '#94a3b8' }}>NONE (Software only)</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Architectural Reality Note */}
      <div style={{ marginTop: '16px', fontSize: '0.775rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
        <em>Physical Prototype Architecture:</em> The physical system incorporates only a single basic filtration stage powered by Relay 1 (GPIO 25). Medium and High stages represent software-calculated filtration recommendations.
      </div>

    </div>
  );
}
