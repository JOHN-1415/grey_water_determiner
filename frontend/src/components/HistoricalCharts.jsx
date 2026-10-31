import React, { useState } from 'react';
import { LineChart, BarChart2, TrendingUp, Download } from 'lucide-react';
import { dataProvider } from '../services/dataProvider';

export default function HistoricalCharts({ history = [] }) {
  const [selectedMetric, setSelectedMetric] = useState('turbidity');

  if (!history || history.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No historical telemetry recorded yet. Telemetry received from ESP32 or demo mode will appear here.
        </p>
      </div>
    );
  }

  // Sort chronological (oldest to newest for plotting left to right)
  const sorted = [...history].sort((a, b) => new Date(a.received_at) - new Date(b.received_at)).slice(-30);

  const metricConfig = {
    turbidity: { label: 'Turbidity (NTU)', color: '#06b6d4', key: 'turbidity_ntu', unit: 'NTU', maxVal: 50 },
    tds: { label: 'TDS (Solids ppm)', color: '#3b82f6', key: 'tds_ppm', unit: 'ppm', maxVal: 1200 },
    temp: { label: 'Temperature (°C)', color: '#10b981', key: 'temperature_c', unit: '°C', maxVal: 60 }
  };

  const current = metricConfig[selectedMetric] || metricConfig.turbidity;

  // Extract points
  const points = sorted.map((item, idx) => {
    const rawVal = item[current.key];
    const val = rawVal !== null && rawVal !== undefined ? Number(rawVal) : 0;
    return {
      index: idx,
      value: val,
      time: item.received_at ? new Date(item.received_at).toLocaleTimeString() : `#${item.sequence || idx}`,
      seq: item.sequence
    };
  });

  const width = 800;
  const height = 220;
  const padding = 40;

  const maxVal = Math.max(...points.map((p) => p.value), current.maxVal * 0.2);
  const minVal = 0;

  const getX = (idx) => padding + (idx / Math.max(1, points.length - 1)) * (width - padding * 2);
  const getY = (val) => height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - padding * 2);

  const pathD = points.length > 0
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.value)}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`
    : '';

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color={current.color} />
            Historical Sensor Telemetry Trends
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Chronological trend data (Last {points.length} telemetry readings)
          </p>
        </div>

        {/* Metric Selector Tabs & CSV Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            gap: '4px'
          }}>
            <button
              className={`tab-pill ${selectedMetric === 'turbidity' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('turbidity')}
            >
              Turbidity (NTU)
            </button>
            <button
              className={`tab-pill ${selectedMetric === 'tds' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('tds')}
            >
              TDS (ppm)
            </button>
            <button
              className={`tab-pill ${selectedMetric === 'temp' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('temp')}
            >
              Temperature (°C)
            </button>
          </div>

          <button
            onClick={() => dataProvider.exportHistoryToCSV(history)}
            className="btn btn-secondary"
            title="Download Telemetry History as CSV"
            style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '550px' }}
        >
          <defs>
            <linearGradient id={`grad-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={current.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={current.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.06)" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.06)" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />

          {/* Y-axis Labels */}
          <text x={padding - 10} y={padding + 4} fill="#64748b" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">
            {maxVal.toFixed(0)}
          </text>
          <text x={padding - 10} y={height / 2 + 4} fill="#64748b" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">
            {((maxVal + minVal) / 2).toFixed(0)}
          </text>
          <text x={padding - 10} y={height - padding + 4} fill="#64748b" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">
            {minVal}
          </text>

          {/* Shaded Area */}
          {areaD && <path d={areaD} fill={`url(#grad-${selectedMetric})`} />}

          {/* Line Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={current.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(pt.value)}
                r="4"
                fill={current.color}
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          ))}

          {/* X-axis First and Last Timestamp Labels */}
          {points.length > 0 && (
            <>
              <text x={getX(0)} y={height - 12} fill="#64748b" fontSize="10" textAnchor="start" fontFamily="var(--font-mono)">
                {points[0].time}
              </text>
              <text x={getX(points.length - 1)} y={height - 12} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
                {points[points.length - 1].time}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
