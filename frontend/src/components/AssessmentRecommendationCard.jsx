import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2, AlertOctagon, Info } from 'lucide-react';

export default function AssessmentRecommendationCard({ assessment }) {
  const level = assessment?.treatment_level || 'UNKNOWN';
  const status = assessment?.assessment_status || 'UNKNOWN';
  const explanation = assessment?.explanation || 'No assessment available.';
  const reasons = assessment?.reasons || [];
  const outsideParams = assessment?.parameters_outside_criteria || [];
  const considered = assessment?.parameters_considered || [];
  const disclaimer = assessment?.safety_disclaimer;

  const levelColorMap = {
    BASIC: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#34d399', badge: 'level-basic' },
    MEDIUM: { bg: 'rgba(6, 182, 212, 0.12)', border: '#06b6d4', text: '#38bdf8', badge: 'level-medium' },
    HIGH: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#fbbf24', badge: 'level-high' },
    UNKNOWN: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#f87171', badge: 'level-unknown' }
  };

  const currentTheme = levelColorMap[level] || levelColorMap.UNKNOWN;

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      marginBottom: '20px',
      borderLeft: `6px solid ${currentTheme.border}`,
      background: `linear-gradient(135deg, ${currentTheme.bg}, rgba(15, 23, 42, 0.8))`
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              WATER QUALITY CLASSIFICATION & ADAPTIVE RECOMMENDATION
            </span>
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', fontSize: '0.7rem' }}>
              Rules v{assessment?.rules_version || '1.0.0'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: currentTheme.text }}>
                {level === 'UNKNOWN' ? 'UNKNOWN / SAFE HOLD' : `${level} TREATMENT`}
              </span>
            </div>
            <span className={`badge ${currentTheme.badge}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              Status: {status}
            </span>
          </div>
        </div>

        {/* Outside Criteria Tags */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>
            CRITERIA DEVIATIONS
          </div>
          {outsideParams.length === 0 ? (
            <span className="badge level-basic" style={{ fontSize: '0.75rem' }}>
              All Parameters Within Basic Limits
            </span>
          ) : (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {outsideParams.map((param) => (
                <span key={param} className="badge level-high" style={{ fontSize: '0.75rem' }}>
                  {param} Exceeds Limits
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explanation Box */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '12px',
        padding: '14px 18px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '0.95rem', color: '#f1f5f9', lineHeight: '1.6', marginBottom: reasons.length > 0 ? '10px' : '0' }}>
          <strong>Assessment Rationale:</strong> {explanation}
        </div>

        {reasons.length > 0 && (
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Metadata info: Parameters considered */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div>
          <strong>Parameters Evaluated:</strong> {considered.length > 0 ? considered.join(', ') : 'None'}
          {considered.includes('ph') ? ' (including optional pH)' : ' (optional pH sensor bypassed)'}
        </div>
        <div>
          <strong>Timestamp:</strong> {assessment?.timestamp ? new Date(assessment.timestamp).toLocaleTimeString() : '--'}
        </div>
      </div>

      {/* Mandatory Safety Disclaimer Banner */}
      <div style={{
        marginTop: '16px',
        padding: '10px 14px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.775rem', color: '#fca5a5', lineHeight: '1.4' }}>
          <strong>Environmental & Health Disclaimer:</strong> {disclaimer || 'Treated water is intended strictly for controlled non-potable reuse (toilet flushing, landscaping, cleaning). Turbidity, TDS, and pH do not verify microbiological safety. Do NOT consume.'}
        </span>
      </div>

    </div>
  );
}
