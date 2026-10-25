import React from 'react';
import { Droplet, Activity, Sliders, Cpu, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function HeaderNav({
  mode,
  setMode,
  deviceStatus,
  latestReading,
  pollingInterval,
  isRefreshing,
  onRefresh,
  onOpenConfig,
  onOpenHardwareModal
}) {
  const connectivity = deviceStatus?.connectivity || 'UNKNOWN';
  const isSimulated = mode === 'SIMULATED';

  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
          }}>
            <Droplet size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                GreyWater Guardian
              </h1>
              <span className={`badge ${isSimulated ? 'badge-simulated' : 'badge-hardware'}`} id="source-mode-badge">
                {isSimulated ? 'SIMULATED DEMO' : 'LIVE ESP32'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Adaptive Greywater Quality Detection & Multi-Stage Filtration
            </p>
          </div>
        </div>

        {/* Status Indicators & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Mode Switcher Toggle */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '4px'
          }}>
            <button
              id="mode-simulated-btn"
              className={`tab-pill ${isSimulated ? 'active' : ''}`}
              onClick={() => setMode('SIMULATED')}
            >
              Demo Simulation
            </button>
            <button
              id="mode-hardware-btn"
              className={`tab-pill ${!isSimulated ? 'active' : ''}`}
              onClick={() => setMode('HARDWARE')}
            >
              Hardware ESP32
            </button>
          </div>

          {/* Connectivity Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem'
          }}>
            <div className={`pulse-dot ${
              connectivity === 'ONLINE' ? 'online' : connectivity === 'STALE_DATA' ? 'stale' : 'offline'
            }`} />
            <span style={{ fontWeight: '600', color: connectivity === 'ONLINE' ? '#34d399' : connectivity === 'STALE_DATA' ? '#fbbf24' : '#f87171' }}>
              {connectivity}
            </span>
            {latestReading?.sequence !== undefined && (
              <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                #{latestReading.sequence}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <button
            id="refresh-btn"
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Poll now"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'water-flowing' : ''} />
          </button>

          <button
            id="open-config-btn"
            className="btn btn-secondary"
            onClick={onOpenConfig}
            style={{ padding: '8px 14px' }}
          >
            <Sliders size={15} />
            <span>Rules Config</span>
          </button>

          <button
            id="open-hardware-btn"
            className="btn btn-primary"
            onClick={onOpenHardwareModal}
            style={{ padding: '8px 14px' }}
          >
            <Cpu size={15} />
            <span>ESP32 Integration</span>
          </button>

        </div>
      </div>
    </header>
  );
}
