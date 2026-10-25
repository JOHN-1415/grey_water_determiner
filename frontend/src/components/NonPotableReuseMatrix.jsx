import React from 'react';
import { Droplet, Flower2, Car, Sparkles, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function NonPotableReuseMatrix({ treatmentLevel, assessmentStatus }) {
  const isHealthy = treatmentLevel !== 'UNKNOWN' && assessmentStatus !== 'SENSOR_ERROR' && assessmentStatus !== 'OFFLINE';

  const applications = [
    {
      id: 'toilet',
      name: 'Toilet Flushing',
      icon: <Droplet size={20} />,
      requiredMinLevel: 'BASIC',
      isAllowed: isHealthy,
      note: 'Primary domestic conservation target; reduces household freshwater demand by up to 30%.'
    },
    {
      id: 'irrigation',
      name: 'Landscape & Garden Subsurface',
      icon: <Flower2 size={20} />,
      requiredMinLevel: 'BASIC',
      isAllowed: isHealthy && treatmentLevel !== 'HIGH',
      note: 'Sub-surface irrigation for ornamental lawns, trees, and shrubs (never spray on edible food crops).'
    },
    {
      id: 'cleaning',
      name: 'Floor & Pavement Washing',
      icon: <Sparkles size={20} />,
      requiredMinLevel: 'MEDIUM',
      isAllowed: isHealthy && (treatmentLevel === 'MEDIUM' || treatmentLevel === 'HIGH'),
      note: 'Requires carbon filtration to eliminate soap scum residues and odor on exterior surfaces.'
    },
    {
      id: 'vehicle',
      name: 'Vehicle & Equipment Rinsing',
      icon: <Car size={20} />,
      requiredMinLevel: 'MEDIUM',
      isAllowed: isHealthy && (treatmentLevel === 'MEDIUM' || treatmentLevel === 'HIGH'),
      note: 'Requires low turbidity (≤ 10 NTU) to prevent streaking or abrasive particulates.'
    },
    {
      id: 'potable',
      name: 'Drinking / Cooking / Bathing',
      icon: <XCircle size={20} />,
      requiredMinLevel: 'PROHIBITED',
      isAllowed: false,
      isStrictlyProhibited: true,
      note: 'STRICTLY PROHIBITED. Greywater filtration does not remove pathogenic bacteria or viruses.'
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={20} color="#10b981" />
            Approved Non-Potable Water Reuse Applications
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Permissible utilization matrix matched against current water classification
          </p>
        </div>

        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.75rem' }}>
          WHO & EPA Non-Potable Guidelines
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {applications.map((app) => (
          <div
            key={app.id}
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: app.isStrictlyProhibited
                ? 'rgba(239, 68, 68, 0.08)'
                : app.isAllowed
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(15, 23, 42, 0.5)',
              border: `1px solid ${
                app.isStrictlyProhibited
                  ? 'rgba(239, 68, 68, 0.3)'
                  : app.isAllowed
                  ? 'rgba(16, 185, 129, 0.35)'
                  : 'var(--border-subtle)'
              }`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: app.isStrictlyProhibited
                    ? 'rgba(239, 68, 68, 0.2)'
                    : app.isAllowed
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(148, 163, 184, 0.1)',
                  color: app.isStrictlyProhibited
                    ? '#f87171'
                    : app.isAllowed
                    ? '#34d399'
                    : '#94a3b8'
                }}>
                  {app.icon}
                </div>

                {app.isStrictlyProhibited ? (
                  <span className="badge badge-error" style={{ fontSize: '0.65rem' }}>
                    PROHIBITED
                  </span>
                ) : app.isAllowed ? (
                  <span className="badge level-basic" style={{ fontSize: '0.65rem' }}>
                    SUITABLE
                  </span>
                ) : (
                  <span className="badge level-unknown" style={{ fontSize: '0.65rem' }}>
                    NOT RECOMMENDED
                  </span>
                )}
              </div>

              <h4 style={{ fontSize: '0.925rem', fontWeight: '700', marginBottom: '6px', color: '#f8fafc' }}>
                {app.name}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
                {app.note}
              </p>
            </div>

            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-subtle)',
              fontFamily: 'var(--font-mono)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '8px'
            }}>
              Required: {app.requiredMinLevel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
