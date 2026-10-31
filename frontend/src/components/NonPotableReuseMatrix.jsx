import React from 'react';
import { Droplet, Flower2, Car, Sparkles, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function NonPotableReuseMatrix({ treatmentLevel, assessmentStatus }) {
  const isHealthy = treatmentLevel !== 'UNKNOWN' && assessmentStatus !== 'SENSOR_ERROR' && assessmentStatus !== 'OFFLINE';

  const isLevel1 = treatmentLevel === 'LEVEL_1' || treatmentLevel === 'BASIC';
  const isLevel2 = treatmentLevel === 'LEVEL_2' || treatmentLevel === 'MEDIUM';
  const isLevel3 = treatmentLevel === 'LEVEL_3' || treatmentLevel === 'HIGH';

  const applications = [
    {
      id: 'toilet',
      name: 'Toilet Flushing',
      icon: <Droplet size={20} />,
      requiredMinLevel: 'LEVEL 1',
      isAllowed: isHealthy,
      note: 'Primary domestic conservation target; reduces household freshwater consumption by up to 30%.'
    },
    {
      id: 'irrigation',
      name: 'Landscape & Garden Subsurface',
      icon: <Flower2 size={20} />,
      requiredMinLevel: 'LEVEL 1',
      isAllowed: isHealthy && !isLevel3,
      note: 'Sub-surface irrigation for ornamental lawns, shrubs, and shade trees (never spray on edible food crops).'
    },
    {
      id: 'cleaning',
      name: 'Floor & Pavement Washing',
      icon: <Sparkles size={20} />,
      requiredMinLevel: 'LEVEL 2',
      isAllowed: isHealthy && (isLevel2 || isLevel3),
      note: 'Requires adsorption/filtration to eliminate surfactant soap residues and odor on exterior surfaces.'
    },
    {
      id: 'vehicle',
      name: 'Vehicle & Equipment Rinsing',
      icon: <Car size={20} />,
      requiredMinLevel: 'LEVEL 2',
      isAllowed: isHealthy && (isLevel2 || isLevel3),
      note: 'Requires low turbidity (≤ 10 NTU) to prevent streaking or abrasive grit damage.'
    },
    {
      id: 'potable',
      name: 'Drinking / Cooking / Bathing',
      icon: <XCircle size={20} />,
      requiredMinLevel: 'STRICTLY PROHIBITED',
      isAllowed: false,
      isStrictlyProhibited: true,
      note: 'STRICTLY PROHIBITED. Greywater assessment does not evaluate or guarantee microbiological safety.'
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={20} color="#10b981" />
            Approved Non-Potable Water Reuse Guidance
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Permissible non-potable reuse utilization matrix matched against current water quality assessment
          </p>
        </div>

        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.75rem' }}>
          Non-Potable Regulatory Reference Matrix
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
                    : 'rgba(255, 255, 255, 0.05)',
                  color: app.isStrictlyProhibited ? '#f87171' : app.isAllowed ? '#34d399' : '#94a3b8'
                }}>
                  {app.icon}
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: app.isStrictlyProhibited ? '#f87171' : app.isAllowed ? '#34d399' : '#94a3b8'
                }}>
                  {app.isStrictlyProhibited ? 'PROHIBITED' : app.isAllowed ? 'SUITABLE' : 'RESTRICTED'}
                </span>
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>
                {app.name}
              </div>

              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
                {app.note}
              </div>
            </div>

            <div style={{
              fontSize: '0.725rem',
              color: 'var(--text-subtle)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '8px',
              fontFamily: 'var(--font-mono)'
            }}>
              Suggested Baseline: {app.requiredMinLevel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
