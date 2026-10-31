import React from 'react';
import { Waves, Zap, Thermometer, TestTube, AlertOctagon, HelpCircle } from 'lucide-react';

export default function LiveSensorCards({ sensors, assessment, isStale }) {
  const turb = sensors?.turbidity_ntu;
  const tds = sensors?.tds_ppm;
  const temp = sensors?.temperature_c;
  const ph = sensors?.ph;

  const turbDetail = assessment?.parameter_details?.turbidity_ntu;
  const tdsDetail = assessment?.parameter_details?.tds_ppm;
  const tempDetail = assessment?.parameter_details?.temperature_c;
  const phDetail = assessment?.parameter_details?.ph;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    }}>
      
      {/* 1. Turbidity Sensor Card */}
      <div className="sensor-card glass-panel" id="sensor-card-turbidity">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
              <Waves size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block' }}>
                TURBIDITY
              </span>
              <span style={{ fontSize: '0.675rem', color: '#fbbf24', fontWeight: '600' }}>
                PROTOTYPE ESTIMATE (REQUIRES CALIBRATION)
              </span>
            </div>
          </div>
          <span className={`badge ${
            turb === null || turb === undefined ? 'badge-error' :
            turb > 25 ? 'level-high' :
            turb > 5 ? 'level-medium' : 'level-basic'
          }`}>
            {turb === null || turb === undefined ? 'NO DATA' :
             turb > 25 ? 'HIGH CLOUDINESS' :
             turb > 5 ? 'MODERATE' : 'CLEAR / LOW'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '10px 0' }}>
          <span className="sensor-value" style={{ color: turb > 25 ? '#fb923c' : turb > 5 ? '#38bdf8' : '#34d399' }}>
            {turb !== null && turb !== undefined && Number.isFinite(Number(turb)) ? Number(turb).toFixed(1) : '--'}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            NTU
          </span>
        </div>

        {/* Meter Bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, (Number(turb) || 0) * 2.5))}%`,
            background: turb > 25 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : turb > 5 ? 'linear-gradient(90deg, #06b6d4, #3b82f6)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Level 1: ≤5.0 NTU</span>
          <span>Level 2: ≤25.0 NTU</span>
        </div>
      </div>

      {/* 2. TDS Sensor Card */}
      <div className="sensor-card glass-panel" id="sensor-card-tds">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Zap size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block' }}>
                TDS (SOLIDS)
              </span>
              <span style={{ fontSize: '0.675rem', color: '#fbbf24', fontWeight: '600' }}>
                PROTOTYPE ESTIMATE (REQUIRES CALIBRATION)
              </span>
            </div>
          </div>
          <span className={`badge ${
            tds === null || tds === undefined ? 'badge-error' :
            tds < 0 ? 'badge-error' :
            tds > 800 ? 'level-high' :
            tds > 300 ? 'level-medium' : 'level-basic'
          }`}>
            {tds === null || tds === undefined ? 'NO DATA' :
             tds < 0 ? 'SENSOR FAULT' :
             tds > 800 ? 'HIGH DISSOLVED' :
             tds > 300 ? 'MODERATE' : 'LOW TDS'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '10px 0' }}>
          <span className="sensor-value" style={{ color: tds < 0 ? '#f43f5e' : tds > 800 ? '#fb923c' : tds > 300 ? '#38bdf8' : '#34d399' }}>
            {tds !== null && tds !== undefined && Number.isFinite(Number(tds)) ? Number(tds).toFixed(0) : '--'}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ppm
          </span>
        </div>

        {/* Meter Bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, (Number(tds) || 0) / 10))}%`,
            background: tds > 800 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : tds > 300 ? 'linear-gradient(90deg, #06b6d4, #3b82f6)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Level 1: ≤300 ppm</span>
          <span>Level 2: ≤800 ppm</span>
        </div>
      </div>

      {/* 3. Temperature Sensor Card (DS18B20) */}
      <div className="sensor-card glass-panel" id="sensor-card-temperature">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Thermometer size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block' }}>
                TEMPERATURE
              </span>
              <span style={{ fontSize: '0.675rem', color: '#38bdf8', fontWeight: '600' }}>
                CONTEXTUAL METRIC (DS18B20)
              </span>
            </div>
          </div>
          <span className="badge" style={{
            background: temp === null || temp === undefined ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.15)',
            color: temp === null || temp === undefined ? '#f87171' : '#cbd5e1'
          }}>
            {temp === null || temp === undefined ? 'DISCONNECTED' : 'DS18B20 (GPIO 4)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '10px 0' }}>
          <span className="sensor-value" style={{ color: temp === null || temp === undefined ? '#94a3b8' : temp > 50 ? '#ef4444' : temp > 35 ? '#f59e0b' : '#34d399' }}>
            {temp !== null && temp !== undefined && Number.isFinite(Number(temp)) ? Number(temp).toFixed(1) : '--'}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            °C
          </span>
        </div>

        {/* Meter Bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{
            height: '100%',
            width: temp !== null && temp !== undefined ? `${Math.min(100, Math.max(0, (Number(temp) || 0) * 1.6))}%` : '0%',
            background: temp > 45 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #06b6d4, #10b981)',
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{temp === null || temp === undefined ? 'Reading Unavailable' : 'Nominal: 15–35°C'}</span>
          <span>Scald Limit: &gt;50°C</span>
        </div>
      </div>

      {/* 4. pH Sensor Card (Optional Hardware Probe) */}
      <div className="sensor-card glass-panel" id="sensor-card-ph">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <TestTube size={18} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              pH LEVEL
            </span>
          </div>
          <span className="badge" style={{
            background: ph === null || ph === undefined ? 'rgba(148, 163, 184, 0.18)' : 'rgba(168, 85, 247, 0.2)',
            color: ph === null || ph === undefined ? '#94a3b8' : '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            {ph === null || ph === undefined ? 'OPTIONAL (OMITTED)' : 'INSTALLED'}
          </span>
        </div>

        {ph === null || ph === undefined ? (
          <div style={{ margin: '8px 0', minHeight: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4 }}>
              Probe uninstalled (per hardware diagram). System validates water using TDS, Turbidity & Temp.
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '10px 0' }}>
              <span className="sensor-value" style={{ color: ph < 6.0 || ph > 9.0 ? '#fb923c' : '#34d399' }}>
                {Number(ph).toFixed(1)}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {ph < 6.5 ? 'Mildly Acidic' : ph > 8.5 ? 'Mildly Alkaline' : 'Neutral Safe'}
              </span>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, (Number(ph) / 14) * 100))}%`,
                background: 'linear-gradient(90deg, #ef4444 0%, #10b981 50%, #3b82f6 100%)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </>
        )}

        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Neutral Range: 6.5–8.5</span>
          <span>Status: {ph === null ? 'Bypassed' : 'Active'}</span>
        </div>
      </div>

    </div>
  );
}
