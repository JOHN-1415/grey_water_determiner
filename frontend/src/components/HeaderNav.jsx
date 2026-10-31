import React from 'react';
import { Droplet, Activity, Sliders, Cpu, RefreshCw, FileText } from 'lucide-react';

export default function HeaderNav({
  mode,
  setMode,
  deviceStatus,
  serialStatus,
  latestReading,
  pollingInterval,
  isRefreshing,
  onRefresh,
  onOpenConfig,
  onOpenHardwareModal,
  onOpenReportModal
}) {
  const connectivity = deviceStatus?.connectivity || (deviceStatus?.is_online ? 'ONLINE' : (deviceStatus?.is_stale ? 'STALE_DATA' : 'OFFLINE'));
  const isSimulated = mode === 'SIMULATED';
  const lastTimeStr = latestReading?.received_at ? new Date(latestReading.received_at).toLocaleTimeString() : null;

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
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                GreyWater Guardian
              </h1>
              <span className={`badge ${isSimulated ? 'badge-simulated' : 'badge-hardware'}`} id="source-mode-badge">
                {isSimulated ? 'SIMULATED DEMO' : 'LIVE ESP32'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              IoT Greywater Quality Assessment & Treatment Recommendation System
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
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
            {lastTimeStr && (
              <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '6px' }}>
                {lastTimeStr}
              </span>
            )}
          </div>

          {/* USB Serial Status Pill */}
          {(!isSimulated || serialStatus?.status === 'CONNECTED') && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${serialStatus?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.775rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>USB:</span>
              <span style={{
                color: serialStatus?.status === 'CONNECTED' ? '#34d399' : '#fbbf24',
                fontWeight: '700'
              }}>
                {serialStatus?.status === 'CONNECTED'
                  ? `${serialStatus.portPath || 'COM'} (Live)`
                  : serialStatus?.status === 'RETRYING'
                  ? 'Scanning...'
                  : 'Disconnected'}
              </span>
            </div>
          )}

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
            id="report-modal-btn"
            className="btn btn-secondary"
            onClick={onOpenReportModal}
            title="View & Download Assessment Reports"
            style={{ padding: '8px 14px', gap: '6px' }}
          >
            <FileText size={15} color="#38bdf8" />
            <span>Assessment Report</span>
          </button>

          <button
            id="open-config-btn"
            className="btn btn-secondary"
            onClick={onOpenConfig}
            style={{ padding: '8px 14px' }}
          >
            <Sliders size={15} />
            <span>Criteria Config</span>
          </button>

          <button
            id="open-hardware-btn"
            className="btn btn-primary"
            onClick={onOpenHardwareModal}
            style={{ padding: '8px 14px' }}
          >
            <Cpu size={15} />
            <span>ESP32 Hardware</span>
          </button>

        </div>
      </div>
    </header>
  );
}
