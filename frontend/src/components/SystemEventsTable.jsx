import React from 'react';
import { History, AlertTriangle, Info, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function SystemEventsTable({ events = [] }) {
  if (!events || events.length === 0) {
    return null;
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'ERROR':
        return <span className="badge badge-error">ERROR</span>;
      case 'WARNING':
        return <span className="badge badge-stale">WARNING</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>INFO</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="#38bdf8" />
            System Events & Sequence Anomaly Log
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Audit trail of sequence integrity, telemetry ingestion, and stage transitions
          </p>
        </div>
        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }}>
          {events.length} Events
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 12px', fontWeight: '700' }}>TIMESTAMP</th>
              <th style={{ padding: '10px 12px', fontWeight: '700' }}>SEVERITY</th>
              <th style={{ padding: '10px 12px', fontWeight: '700' }}>EVENT TYPE</th>
              <th style={{ padding: '10px 12px', fontWeight: '700' }}>MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 10).map((e) => (
              <tr key={e.id || `${e.created_at}-${Math.random()}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                  {e.created_at ? new Date(e.created_at).toLocaleTimeString() : '--'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {getSeverityBadge(e.severity)}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#e2e8f0' }}>
                  {e.event_type}
                </td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {e.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
