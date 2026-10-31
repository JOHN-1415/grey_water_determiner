/**
 * Data Provider Interface for GreyWater Guardian
 * IoT Greywater Quality Assessment & Recommendation System
 *
 * Implements:
 * - Single point of truth for sensor telemetry
 * - SIMULATED mode (10 realistic assessment scenarios)
 * - HARDWARE mode (ESP32 USB Serial & REST API ingestion)
 * - Downloadable Assessment Reports (CSV & JSON export)
 */

import { assessWaterQuality, DEFAULT_RULES_CONFIG } from '../utils/rulesEngine';

const API_BASE = '/api/v1';

export const SCENARIO_PRESETS = [
  { id: 1, name: '1. Low Contamination (Level 1: Basic)', desc: 'Light rinse greywater meeting Level 1 criteria' },
  { id: 2, name: '2. Moderate Contamination (Level 2: Moderate)', desc: 'Shower / bath greywater with soaps & moderate turbidity' },
  { id: 3, name: '3. High Contamination (Level 3: Advanced)', desc: 'Heavy laundry wash with high turbidity, surfactants & TDS' },
  { id: 4, name: '4. Missing pH Sensor (Prototype Setup)', desc: 'Matches physical prototype (pH probe omitted)' },
  { id: 5, name: '5. Sensor Fault (Implausible TDS)', desc: 'Probe anomaly reporting negative TDS value' },
  { id: 6, name: '6. Stale Telemetry (Communication Delay)', desc: 'Telemetry older than stale threshold (>30s)' },
  { id: 7, name: '7. Device Offline', desc: 'ESP32 disconnected from power or USB' },
  { id: 8, name: '8. Severe Turbidity Surge (Level 3)', desc: 'Heavy particulate runoff triggering Level 3' },
  { id: 9, name: '9. Disconnected Temp Probe (Null °C)', desc: 'DS18B20 probe unplugged; handled without faking 25°C' },
  { id: 10, name: '10. Warm Greywater Thermal Context', desc: 'Hot wash water (48°C) recorded as thermal context' }
];

// Offline deterministic mock scenarios
const LOCAL_MOCK_SCENARIOS = {
  1: {
    device_id: 'GW-001',
    sequence: 101,
    uptime_seconds: 1200,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.2, tds_ppm: 180.0, turbidity_ntu: 3.2, temperature_c: 24.5 },
    classification: 'LEVEL_1'
  },
  2: {
    device_id: 'GW-001',
    sequence: 102,
    uptime_seconds: 1260,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.6, tds_ppm: 460.0, turbidity_ntu: 14.8, temperature_c: 27.2 },
    classification: 'LEVEL_2'
  },
  3: {
    device_id: 'GW-001',
    sequence: 103,
    uptime_seconds: 1320,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 8.9, tds_ppm: 940.0, turbidity_ntu: 38.5, temperature_c: 29.8 },
    classification: 'LEVEL_3'
  },
  4: {
    device_id: 'GW-001',
    sequence: 104,
    uptime_seconds: 1380,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: null, tds_ppm: 220.0, turbidity_ntu: 4.1, temperature_c: 25.1 },
    classification: 'LEVEL_1'
  },
  5: {
    device_id: 'GW-001',
    sequence: 105,
    uptime_seconds: 1440,
    source_mode: 'SIMULATED',
    device_status: 'SENSOR_ERROR',
    sensors: { ph: 7.1, tds_ppm: -45.0, turbidity_ntu: 12.0, temperature_c: 26.0 },
    classification: 'UNKNOWN'
  },
  6: {
    device_id: 'GW-001',
    sequence: 106,
    uptime_seconds: 1500,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    is_stale: true,
    stale_offset_seconds: 80,
    sensors: { ph: 7.3, tds_ppm: 310.0, turbidity_ntu: 8.5, temperature_c: 26.4 },
    classification: 'UNKNOWN'
  },
  7: {
    device_id: 'GW-001',
    sequence: 107,
    uptime_seconds: 0,
    source_mode: 'SIMULATED',
    device_status: 'OFFLINE',
    is_offline: true,
    sensors: { ph: null, tds_ppm: null, turbidity_ntu: null, temperature_c: null },
    classification: 'UNKNOWN'
  },
  8: {
    device_id: 'GW-001',
    sequence: 108,
    uptime_seconds: 1620,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 8.1, tds_ppm: 420.0, turbidity_ntu: 65.0, temperature_c: 27.0 },
    classification: 'LEVEL_3'
  },
  9: {
    device_id: 'GW-001',
    sequence: 109,
    uptime_seconds: 1680,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: null, tds_ppm: 260.0, turbidity_ntu: 3.8, temperature_c: null },
    classification: 'LEVEL_1'
  },
  10: {
    device_id: 'GW-001',
    sequence: 110,
    uptime_seconds: 1740,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.7, tds_ppm: 410.0, turbidity_ntu: 11.2, temperature_c: 48.0 },
    classification: 'LEVEL_2'
  }
};

let cachedRulesConfig = { ...DEFAULT_RULES_CONFIG };

export const dataProvider = {
  /**
   * Fetches the latest reading and applies water quality assessment
   */
  async fetchLatestReading(deviceId = 'GW-001', mode = 'SIMULATED', activeScenarioId = 1) {
    if (mode === 'HARDWARE') {
      try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/latest`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'SUCCESS' && json.data) {
            const raw = json.data;
            const assessment = assessWaterQuality(raw.sensors, cachedRulesConfig, {
              is_stale: raw.is_stale,
              is_offline: raw.device_status === 'OFFLINE'
            });
            return {
              ...raw,
              assessment
            };
          }
        }
      } catch (err) {
        console.warn('[DataProvider] Backend unavailable in HARDWARE mode, falling back to local snapshot:', err.message);
      }
    }

    // SIMULATED mode or offline fallback
    const scenario = LOCAL_MOCK_SCENARIOS[activeScenarioId] || LOCAL_MOCK_SCENARIOS[1];
    const isStale = scenario.is_stale || false;
    const isOffline = scenario.is_offline || false;

    const assessment = assessWaterQuality(scenario.sensors, cachedRulesConfig, {
      is_stale: isStale,
      is_offline: isOffline
    });

    const receivedAt = isStale
      ? new Date(Date.now() - (scenario.stale_offset_seconds || 80) * 1000).toISOString()
      : new Date().toISOString();

    return {
      id: 9999,
      device_id: scenario.device_id,
      sequence: scenario.sequence,
      uptime_seconds: scenario.uptime_seconds,
      received_at: receivedAt,
      sensors: scenario.sensors,
      device_status: scenario.device_status,
      source_mode: 'SIMULATED',
      is_stale: isStale,
      reading_age_seconds: isStale ? (scenario.stale_offset_seconds || 80) : 1,
      assessment
    };
  },

  /**
   * Fetches device status
   */
  async fetchDeviceStatus(deviceId = 'GW-001', mode = 'SIMULATED', activeScenarioId = 1) {
    if (mode === 'HARDWARE') {
      try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/status`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'SUCCESS') return json.data;
        }
      } catch (err) {
        console.warn('[DataProvider] Hardware status unavailable, using fallback:', err.message);
      }
    }

    const scenario = LOCAL_MOCK_SCENARIOS[activeScenarioId] || LOCAL_MOCK_SCENARIOS[1];
    return {
      device_id: deviceId,
      status: scenario.device_status === 'OFFLINE' ? 'OFFLINE' : (scenario.is_stale ? 'STALE' : 'ONLINE'),
      is_online: scenario.device_status === 'ONLINE' && !scenario.is_stale,
      is_stale: scenario.is_stale || false,
      last_seen: new Date().toISOString(),
      age_seconds: scenario.is_stale ? 80 : 2
    };
  },

  /**
   * Fetches historical readings
   */
  async fetchHistory(deviceId = 'GW-001', mode = 'SIMULATED', limit = 50) {
    if (mode === 'HARDWARE') {
      try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/history?limit=${limit}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'SUCCESS' && Array.isArray(json.data) && json.data.length > 0) {
            return json.data.map((item) => ({
              ...item,
              assessment: assessWaterQuality(
                {
                  ph: item.ph,
                  tds_ppm: item.tds_ppm,
                  turbidity_ntu: item.turbidity_ntu,
                  temperature_c: item.temperature_c
                },
                cachedRulesConfig
              )
            }));
          }
        }
      } catch (err) {
        console.warn('[DataProvider] History fetch failed, using local generator:', err.message);
      }
    }

    // Generate simulated historical readings for charts
    const history = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 60 * 1000).toISOString();
      const tds = Math.round(200 + Math.sin(i / 3) * 80 + (i % 5) * 15);
      const turb = Number((3.5 + Math.cos(i / 2) * 2.5 + (i % 3) * 0.8).toFixed(1));
      const temp = Number((24.0 + Math.sin(i / 4) * 2.0).toFixed(1));
      const ph = Number((7.2 + Math.cos(i / 5) * 0.3).toFixed(1));

      const sensors = { ph, tds_ppm: tds, turbidity_ntu: turb, temperature_c: temp };
      const assessment = assessWaterQuality(sensors, cachedRulesConfig);

      history.push({
        id: 1000 + (25 - i),
        device_id: deviceId,
        received_at: time,
        sequence: 50 + (25 - i),
        tds_ppm: tds,
        turbidity_ntu: turb,
        temperature_c: temp,
        ph: ph,
        assigned_classification: assessment.treatment_level,
        assessment_status: assessment.assessment_status,
        assessment
      });
    }
    return history;
  },

  /**
   * Fetches system event log
   */
  async fetchSystemEvents(deviceId = 'GW-001', mode = 'SIMULATED') {
    if (mode === 'HARDWARE') {
      try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/events`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'SUCCESS' && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('[DataProvider] Events fetch failed:', err.message);
      }
    }

    return [
      { id: 1, event_type: 'SYSTEM_BOOT', message: 'GreyWater Guardian IoT Assessment System initialized (Sensor-only mode)', severity: 'INFO', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, event_type: 'SERIAL_CONNECTED', message: 'ESP32 USB Serial stream synchronized at 115200 baud', severity: 'INFO', created_at: new Date(Date.now() - 3000000).toISOString() },
      { id: 3, event_type: 'CALIBRATION_BASELINE', message: 'TDS (GPIO 34) & Turbidity (GPIO 35) analog baselines calibrated', severity: 'INFO', created_at: new Date(Date.now() - 1800000).toISOString() },
      { id: 4, event_type: 'PROTOTYPE_NOTICE', message: 'Physical prototype is an IoT assessment unit; no physical filtration unit is activated', severity: 'INFO', created_at: new Date(Date.now() - 600000).toISOString() }
    ];
  },

  /**
   * Fetches USB Serial Collector Status
   */
  async fetchSerialStatus() {
    try {
      const res = await fetch(`${API_BASE}/serial/status`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'SUCCESS') return json.data;
      }
    } catch {
      // offline
    }
    return { status: 'DISCONNECTED', portPath: 'COM7', baudRate: 115200, is_fresh: false };
  },

  /**
   * Rules Configuration Get / Set
   */
  async getRulesConfig() {
    try {
      const res = await fetch(`${API_BASE}/rules/config`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'SUCCESS' && json.config) {
          cachedRulesConfig = json.config;
          return json.config;
        }
      }
    } catch {
      // fallback
    }
    return cachedRulesConfig;
  },

  async updateRulesConfig(newConfig) {
    try {
      const res = await fetch(`${API_BASE}/rules/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'SUCCESS' && json.config) {
          cachedRulesConfig = json.config;
          return json.config;
        }
      }
    } catch {
      // fallback
    }
    cachedRulesConfig = { ...cachedRulesConfig, ...newConfig };
    return cachedRulesConfig;
  },

  /**
   * Exports historical readings and assessments to CSV
   */
  exportHistoryToCSV(history = []) {
    if (!history || history.length === 0) return;
    const headers = ['Timestamp', 'Device ID', 'Sequence', 'TDS (ppm)', 'Turbidity (NTU)', 'Temperature (°C)', 'pH', 'Classification', 'Status', 'Recommendation'];
    const rows = history.map((r) => [
      r.received_at,
      r.device_id,
      r.sequence,
      r.tds_ppm !== null ? r.tds_ppm : 'N/A',
      r.turbidity_ntu !== null ? r.turbidity_ntu : 'N/A',
      r.temperature_c !== null ? r.temperature_c : 'N/A',
      r.ph !== null ? r.ph : 'N/A',
      r.assigned_classification || r.assessment?.treatment_level || 'UNKNOWN',
      r.assessment_status || r.assessment?.assessment_status || 'UNKNOWN',
      `"${(r.assessment?.explanation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GreyWater_Guardian_Assessment_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Exports assessment report to JSON
   */
  exportAssessmentToJSON(latestReading, history = []) {
    const report = {
      project: 'GreyWater Guardian',
      subtitle: 'IoT Greywater Quality Assessment & Treatment Recommendation System',
      generated_at: new Date().toISOString(),
      disclaimer: 'Informational Recommendation Only: Prototype does NOT physically purify water. Does not certify drinking water potability or microbiological safety.',
      latest_assessment: latestReading,
      history_sample: history.slice(0, 50)
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `GreyWater_Guardian_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
