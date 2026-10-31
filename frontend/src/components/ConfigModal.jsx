import React, { useState } from 'react';
import { X, Sliders, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { DEFAULT_RULES_CONFIG } from '../utils/rulesEngine';

export default function ConfigModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  pollingInterval,
  setPollingInterval
}) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    version: config?.version || '2.0.0-custom',
    turbidity_level1_max: config?.thresholds?.turbidity_ntu?.level_1_max ?? config?.thresholds?.turbidity_ntu?.basic_max ?? 5.0,
    turbidity_level2_max: config?.thresholds?.turbidity_ntu?.level_2_max ?? config?.thresholds?.turbidity_ntu?.medium_max ?? 25.0,
    tds_level1_max: config?.thresholds?.tds_ppm?.level_1_max ?? config?.thresholds?.tds_ppm?.basic_max ?? 300,
    tds_level2_max: config?.thresholds?.tds_ppm?.level_2_max ?? config?.thresholds?.tds_ppm?.medium_max ?? 800,
    ph_basic_min: config?.thresholds?.ph?.basic_min ?? 6.5,
    ph_basic_max: config?.thresholds?.ph?.basic_max ?? 8.5,
    poll_interval: pollingInterval / 1000
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...config,
      version: form.version,
      thresholds: {
        ...config.thresholds,
        turbidity_ntu: {
          optional: false,
          level_1_max: Number(form.turbidity_level1_max),
          level_2_max: Number(form.turbidity_level2_max),
          basic_max: Number(form.turbidity_level1_max),
          medium_max: Number(form.turbidity_level2_max)
        },
        tds_ppm: {
          optional: false,
          level_1_max: Number(form.tds_level1_max),
          level_2_max: Number(form.tds_level2_max),
          basic_max: Number(form.tds_level1_max),
          medium_max: Number(form.tds_level2_max)
        },
        ph: {
          optional: true,
          basic_min: Number(form.ph_basic_min),
          basic_max: Number(form.ph_basic_max),
          medium_min: 6.0,
          medium_max: 9.0
        }
      }
    };
    onSaveConfig(updated);
    setPollingInterval(Number(form.poll_interval) * 1000);
    onClose();
  };

  const handleReset = () => {
    setForm({
      version: '2.0.0-prototype',
      turbidity_level1_max: 5.0,
      turbidity_level2_max: 25.0,
      tds_level1_max: 300,
      tds_level2_max: 800,
      ph_basic_min: 6.5,
      ph_basic_max: 8.5,
      poll_interval: 3
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                Assessment Rules Engine Configuration
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Configurable water quality classification thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Prototype Assessment Notice */}
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '18px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.775rem', color: '#fde68a' }}>
            <strong>Notice:</strong> These thresholds represent experimental prototype assessment criteria. They are configurable for laboratory calibration and do not certify drinking water standards.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* Turbidity Level 1 Max */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                Turbidity Level 1 Max (NTU)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={form.turbidity_level1_max}
                onChange={(e) => setForm({ ...form, turbidity_level1_max: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#f8fafc' }}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Default: 5.0 NTU (Satisfies Level 1)</span>
            </div>

            {/* Turbidity Level 2 Max */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                Turbidity Level 2 Max (NTU)
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="100"
                value={form.turbidity_level2_max}
                onChange={(e) => setForm({ ...form, turbidity_level2_max: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#f8fafc' }}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Default: 25.0 NTU (&gt;25 triggers Level 3)</span>
            </div>

            {/* TDS Level 1 Max */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                TDS Level 1 Max (ppm)
              </label>
              <input
                type="number"
                step="10"
                min="50"
                max="1000"
                value={form.tds_level1_max}
                onChange={(e) => setForm({ ...form, tds_level1_max: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#f8fafc' }}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Default: 300 ppm (Satisfies Level 1)</span>
            </div>

            {/* TDS Level 2 Max */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                TDS Level 2 Max (ppm)
              </label>
              <input
                type="number"
                step="50"
                min="200"
                max="3000"
                value={form.tds_level2_max}
                onChange={(e) => setForm({ ...form, tds_level2_max: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#f8fafc' }}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Default: 800 ppm (&gt;800 triggers Level 3)</span>
            </div>

            {/* Polling Interval */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                Dashboard Polling Cadence (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={form.poll_interval}
                onChange={(e) => setForm({ ...form, poll_interval: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#f8fafc' }}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Default: 3 seconds (Matches ESP32 rate)</span>
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={15} />
              <span>Reset Defaults</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={15} />
                <span>Save & Apply</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
