import React from 'react';
import { X, Download, FileText, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { dataProvider } from '../services/dataProvider';

export default function AssessmentReportModal({
  isOpen,
  onClose,
  latestReading,
  history = []
}) {
  if (!isOpen) return null;

  const assessment = latestReading?.assessment;
  const level = assessment?.treatment_level || 'UNKNOWN';

  const handleDownloadCSV = () => {
    dataProvider.exportHistoryToCSV(history);
  };

  const handleDownloadJSON = () => {
    dataProvider.exportAssessmentToJSON(latestReading, history);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#38bdf8" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                Greywater Assessment & Recommendation Report
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Project: GreyWater Guardian • Environmental Science & IoT System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Assessment Summary Box */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
            Latest Evaluation Snapshot ({latestReading?.received_at ? new Date(latestReading.received_at).toLocaleTimeString() : 'N/A'})
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Turbidity</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8' }}>
                {latestReading?.sensors?.turbidity_ntu ?? 'N/A'} NTU
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TDS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#34d399' }}>
                {latestReading?.sensors?.tds_ppm ?? 'N/A'} ppm
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Temperature</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fbbf24' }}>
                {latestReading?.sensors?.temperature_c !== null ? `${latestReading?.sensors?.temperature_c} °C` : 'N/A'}
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Assigned Level</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc' }}>
                {level}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.5' }}>
            <strong>Recommendation Summary: </strong>
            {assessment?.explanation || 'No assessment data available.'}
          </div>
        </div>

        {/* Scientific & Regulatory Limitations */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <ShieldAlert size={18} color="#f87171" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fca5a5', margin: 0 }}>
              Mandatory Scientific & Regulatory Limitations
            </h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#fecaca', lineHeight: '1.4' }}>
            <li><strong>Sensor Scope:</strong> Sensors measure only turbidity, TDS, and temperature. Heavy metals, pathogens, BOD, and toxins are unmeasured.</li>
            <li><strong>No Potability Certification:</strong> This system does NOT evaluate drinking water safety or certify potability.</li>
            <li><strong>No Microbiological Confirmation:</strong> Does not verify absence of viruses, coliforms, or pathogens.</li>
            <li><strong>Informational Only:</strong> The physical prototype does NOT purify water; recommendations are analytical guidance only.</li>
          </ul>
        </div>

        {/* Export Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Download size={16} />
            Download History CSV ({history.length} records)
          </button>

          <button
            onClick={handleDownloadJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#334155',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Download size={16} />
            Download Full Assessment JSON
          </button>
        </div>

      </div>
    </div>
  );
}

