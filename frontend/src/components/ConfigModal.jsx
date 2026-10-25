import React, { useState } from 'react';
import { X, Sliders, Save, RotateCcw } from 'lucide-react';
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
    version: config?.version || '1.0.0-custom',
    turbidity_basic_max: config?.thresholds?.turbidity_ntu?.basic_max ?? 5.0,
    turbidity_medium_max: config?.thresholds?.turbidity_ntu?.medium_max ?? 25.0,
    tds_basic_max: config?.thresholds?.tds_ppm?.basic_max ?? 300,
    tds_medium_max: config?.thresholds?.tds_ppm?.medium_max ?? 800,
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
          basic_max: Number(form.turbidity_basic_max),
          medium_max: Number(form.turbidity_medium_max)
        },
        tds_ppm: {
          optional: false,
          basic_max: Number(form.tds_basic_max),
          medium_max: Number(form.tds_medium_max)
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
      version: '1.0.0-prototype',
      turbidity_basic_max: DEFAULT_RULES_CONFIG.thresholds.turbidity_ntu.basic_max,
      turbidity_medium_max: DEFAULT_RULES_CONFIG.thresholds.turbidity_ntu.medium_max,
      tds_basic_max: DEFAULT_RULES_CONFIG.thresholds.tds_ppm.basic_max,
      tds_medium_max: DEFAULT_RULES_CONFIG.thresholds.tds_ppm.medium_max,
      ph_basic_min: DEFAULT_RULES_CONFIG.thresholds.ph.basic_min,
      ph_basic_max: DEFAULT_RULES_CONFIG.thresholds.ph.basic_max,
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc' }}>
                Rules Engine Thresholds Configuration
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Section 5.3: Configurable water quality classification limits
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

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* Turbidity Config */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#38bdf8', marginBottom: '12px' }}>
                Turbidity Thresholds (NTU)
              </h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Basic Max Limit (NTU)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.turbidity_basic_max}
                  onChange={(e) => setForm({ ...form, turbidity_basic_max: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Medium Max Limit (NTU)
                </label>
                <input
                  type="number"
                  step="1.0"
                  value={form.turbidity_medium_max}
                  onChange={(e) => setForm({ ...form, turbidity_medium_max: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
            </div>

            {/* TDS Config */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#60a5fa', marginBottom: '12px' }}>
                TDS Thresholds (ppm)
              </h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Basic Max Limit (ppm)
                </label>
                <input
                  type="number"
                  value={form.tds_basic_max}
                  onChange={(e) => setForm({ ...form, tds_basic_max: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Medium Max Limit (ppm)
                </label>
                <input
                  type="number"
                  value={form.tds_medium_max}
                  onChange={(e) => setForm({ ...form, tds_medium_max: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
            </div>

            {/* pH Config */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#c084fc', marginBottom: '12px' }}>
                Optional pH Bounds
              </h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Basic Min pH
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ph_basic_min}
                  onChange={(e) => setForm({ ...form, ph_basic_min: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Basic Max pH
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ph_basic_max}
                  onChange={(e) => setForm({ ...form, ph_basic_max: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
            </div>

            {/* Dashboard Polling Interval */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#34d399', marginBottom: '12px' }}>
                Dashboard Telemetry Polling
              </h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Poll Interval (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.poll_interval}
                  onChange={(e) => setForm({ ...form, poll_interval: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                Configures real-time polling cadence for hardware telemetry.
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              <RotateCcw size={15} />
              Reset to Defaults
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <Save size={15} />
                Save & Apply Config
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
