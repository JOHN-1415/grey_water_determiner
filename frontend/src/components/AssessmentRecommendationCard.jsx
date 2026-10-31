import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import { getScientificLimitations } from '../utils/rulesEngine';

export default function AssessmentRecommendationCard({ assessment }) {
  const level = assessment?.treatment_level || 'UNKNOWN';
  const status = assessment?.assessment_status || 'UNKNOWN';
  const explanation = assessment?.explanation || 'No assessment available.';
  const reasons = assessment?.reasons || [];
  const outsideParams = assessment?.parameters_outside_criteria || [];
  const considered = assessment?.parameters_considered || [];
  const rec = assessment?.recommendation;

  const levelColorMap = {
    LEVEL_1: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#34d399', badge: 'level-basic', title: 'LEVEL 1 — BASIC TREATMENT RECOMMENDATION' },
    LEVEL_2: { bg: 'rgba(56, 189, 248, 0.12)', border: '#0284c7', text: '#38bdf8', badge: 'level-medium', title: 'LEVEL 2 — MODERATE TREATMENT RECOMMENDATION' },
    LEVEL_3: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#fbbf24', badge: 'level-high', title: 'LEVEL 3 — ADVANCED TREATMENT RECOMMENDATION' },
    UNKNOWN: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#f87171', badge: 'level-unknown', title: 'UNKNOWN / INSUFFICIENT SENSOR DATA' }
  };

  const currentTheme = levelColorMap[level] || levelColorMap.UNKNOWN;
  const limitations = getScientificLimitations();

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
              WATER QUALITY CLASSIFICATION & TREATMENT RECOMMENDATION
            </span>
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', fontSize: '0.7rem' }}>
              Engine v{assessment?.rules_version || '2.0.0'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: currentTheme.text }}>
                {currentTheme.title}
              </span>
            </div>
            <span className={`badge ${currentTheme.badge}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              Status: {status}
            </span>
          </div>
        </div>

        {/* Criteria Deviations */}
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
                  {param} Exceeds Baseline
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explanation & Rationale */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '0.95rem', color: '#f1f5f9', lineHeight: '1.6', marginBottom: reasons.length > 0 ? '8px' : '0' }}>
          <strong>Assessment Rationale: </strong> {explanation}
        </div>

        {reasons.length > 0 && (
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        )}

        {/* Informational Treatment Guidance Box */}
        {rec?.suggested_treatment_methods && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.15)'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: currentTheme.text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} /> Suggested External Treatment Approaches:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {rec.suggested_treatment_methods.map((method, idx) => (
                <li key={idx}>{method}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Evaluated Parameters Summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
        <div>
          <strong>Parameters Evaluated:</strong> {considered.length > 0 ? considered.join(', ') : 'None'}
          {considered.includes('ph') ? ' (including optional pH)' : ' (optional pH uninstalled)'}
        </div>
        <div>
          <strong>Evaluated At:</strong> {assessment?.timestamp ? new Date(assessment.timestamp).toLocaleTimeString() : '--'}
        </div>
      </div>

      {/* Scientific & Regulatory Limitations */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldAlert size={16} color="#f87171" style={{ flexShrink: 0 }} />
          <strong style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
            Important Scientific & Regulatory Limitations:
          </strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.775rem', color: '#fecaca', lineHeight: '1.4' }}>
          {limitations.map((limit, idx) => (
            <li key={idx}>{limit}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}
