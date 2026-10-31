import React from 'react';
import { Filter, Layers, Info, CheckCircle2, ShieldAlert, Sparkles, Droplets, ArrowRight } from 'lucide-react';

export default function TreatmentRecommendationGuide({ assessment }) {
  const level = assessment?.treatment_level || 'UNKNOWN';
  const rec = assessment?.recommendation;

  const levelColorMap = {
    LEVEL_1: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', title: 'Level 1: Basic Treatment' },
    LEVEL_2: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.3)', title: 'Level 2: Moderate Treatment' },
    LEVEL_3: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', title: 'Level 3: Advanced Treatment' },
    UNKNOWN: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', title: 'Unknown / Insufficient Data' }
  };

  const currentTheme = levelColorMap[level] || levelColorMap.UNKNOWN;

  const suggestedStages = [
    {
      num: 1,
      name: 'Coarse Sediment & Mesh Screening',
      desc: 'Lint, hair, and suspended particulate filtration (100–200 µm)',
      activeFor: ['LEVEL_1', 'LEVEL_2', 'LEVEL_3']
    },
    {
      num: 2,
      name: 'Activated Carbon Adsorption',
      desc: 'Adsorption of dissolved detergents, surfactants, and odors',
      activeFor: ['LEVEL_2', 'LEVEL_3']
    },
    {
      num: 3,
      name: 'Fine Filtration & Disinfection Polishing',
      desc: 'Microfiltration/UF membrane barrier + UV or chlorination',
      activeFor: ['LEVEL_3']
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
      
      {/* Informational Prototype Notice Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        marginBottom: '20px'
      }}>
        <Info size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.5' }}>
          <strong style={{ color: '#f8fafc' }}>Informational Treatment Pathway: </strong>
          The physical prototype operates strictly as an <strong>IoT Water-Quality Assessment System</strong>. 
          No physical filtration unit or pump is attached. The pathways below represent <strong>recommended treatment methods</strong> based on evaluated sensor parameters.
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={22} color={currentTheme.color} />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
              Recommended Treatment Pathway
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Assigned Recommendation: <strong style={{ color: currentTheme.color }}>{currentTheme.title}</strong>
            </div>
          </div>
        </div>

        <div style={{
          padding: '6px 14px',
          borderRadius: '8px',
          background: currentTheme.bg,
          border: `1px solid ${currentTheme.border}`,
          fontSize: '0.8rem',
          fontWeight: '700',
          color: currentTheme.color,
          fontFamily: 'var(--font-mono)'
        }}>
          STATUS: {assessment?.assessment_status || 'EVALUATED'}
        </div>
      </div>

      {/* Recommended Stages Diagram */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {suggestedStages.map((stage) => {
          const isRecommended = stage.activeFor.includes(level);
          return (
            <div
              key={stage.num}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: isRecommended ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.4)',
                border: isRecommended ? `1.5px solid ${currentTheme.color}` : '1px dashed rgba(148, 163, 184, 0.2)',
                opacity: isRecommended ? 1 : 0.45,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isRecommended ? currentTheme.bg : 'rgba(255, 255, 255, 0.05)',
                  color: isRecommended ? currentTheme.color : '#94a3b8'
                }}>
                  STAGE {stage.num}
                </span>
                {isRecommended ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: currentTheme.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> RECOMMENDED
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>BYPASSED</span>
                )}
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>
                {stage.name}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {stage.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Methods List */}
      {rec?.suggested_treatment_methods && rec.suggested_treatment_methods.length > 0 && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color={currentTheme.color} />
            Specific Suggested External Treatment Methods for {currentTheme.title}:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {rec.suggested_treatment_methods.map((method, idx) => (
              <li key={idx} style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                {method}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
