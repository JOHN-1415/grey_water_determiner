import React, { useState } from 'react';
import { X, Cpu, Copy, Check, Terminal, Info, ShieldAlert } from 'lucide-react';

export default function HardwareIntegrationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);

  const curlCommand = `curl -X POST http://localhost:5000/api/v1/telemetry \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: gw-esp32-secret-2026" \\
  -d '{
    "device_id": "GW-001",
    "sequence": 1042,
    "uptime_seconds": 5200,
    "source_mode": "HARDWARE",
    "device_status": "ONLINE",
    "sensors": {
      "ph": null,
      "tds_ppm": 420.0,
      "turbidity_ntu": 18.0,
      "temperature_c": 27.4
    },
    "classification": "LEVEL_2"
  }'`;

  const serialJsonSample = `{"device_id":"GW-001","sequence":1,"temperature_c":27.4,"tds_ppm":420.0,"turbidity_ntu":18.0,"classification":"LEVEL_2","source_mode":"HARDWARE"}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedSerial(true);
      setTimeout(() => setCopiedSerial(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
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
        maxWidth: '780px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={24} color="#38bdf8" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                ESP32 Hardware & Telemetry Architecture
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Physical prototype sensor mapping & telemetry specifications
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

        {/* Prototype Architecture Disclaimer */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px'
        }}>
          <Info size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            <strong style={{ color: '#f8fafc' }}>Physical Prototype Reality: </strong>
            The prototype operates strictly as an <strong>IoT Water Quality Assessment & Recommendation System</strong>. 
            The two-channel relay module present on the hardware board is <strong>unassigned and unused</strong>. 
            No physical pump or physical filtration unit is connected or operated.
          </div>
        </div>

        {/* Confirmed Pin Assignment Table */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>
          Confirmed Physical Hardware Wiring
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Component</th>
              <th style={{ padding: '8px 12px', color: '#94a3b8' }}>ESP32 Pin</th>
              <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Bus / Signal Type</th>
              <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Status in System</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#f8fafc' }}>DS18B20 Temp Probe</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>GPIO 4</td>
              <td style={{ padding: '8px 12px' }}>1-Wire Digital Bus (4.7kΩ pull-up)</td>
              <td style={{ padding: '8px 12px', color: '#34d399' }}>Active Sensor (Contextual)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#f8fafc' }}>Analog TDS Sensor</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>GPIO 34</td>
              <td style={{ padding: '8px 12px' }}>ADC1 Channel 6 (0–3.3V)</td>
              <td style={{ padding: '8px 12px', color: '#34d399' }}>Active Assessment Sensor</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#f8fafc' }}>Analog Turbidity Sensor</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>GPIO 35</td>
              <td style={{ padding: '8px 12px' }}>ADC1 Channel 7 (0–3.3V)</td>
              <td style={{ padding: '8px 12px', color: '#34d399' }}>Active Assessment Sensor</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#f8fafc' }}>Relay Module Channels</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>GPIO 25, 26, 27</td>
              <td style={{ padding: '8px 12px' }}>Active-LOW relay drivers</td>
              <td style={{ padding: '8px 12px', color: '#f87171' }}>Unused / Unassigned</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#f8fafc' }}>pH Probe</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>None</td>
              <td style={{ padding: '8px 12px' }}>Omitted from diagram</td>
              <td style={{ padding: '8px 12px', color: '#94a3b8' }}>Optional (Uninstalled)</td>
            </tr>
          </tbody>
        </table>

        {/* USB Serial Telemetry Format */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} color="#34d399" />
              USB Serial Stream Format (115200 baud)
            </h3>
            <button
              onClick={() => copyToClipboard(serialJsonSample, 'serial')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#cbd5e1',
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copiedSerial ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
              {copiedSerial ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.775rem',
            color: '#34d399',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            margin: 0
          }}>
            {serialJsonSample}
          </pre>
        </div>

        {/* REST API cURL Example */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              REST API Telemetry Ingestion (POST /api/v1/telemetry)
            </h3>
            <button
              onClick={() => copyToClipboard(curlCommand, 'curl')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#cbd5e1',
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copiedCurl ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
              {copiedCurl ? 'Copied' : 'Copy cURL'}
            </button>
          </div>
          <pre style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.775rem',
            color: '#38bdf8',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            margin: 0
          }}>
            {curlCommand}
          </pre>
        </div>

      </div>
    </div>
  );
}
