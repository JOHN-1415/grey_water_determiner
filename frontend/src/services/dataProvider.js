/**
 * Single Data Provider Interface for GreyWater Guardian
 *
 * Implements Section 4 & Section 8 requirements:
 * - Single point of truth for sensor telemetry
 * - Supports SIMULATED mode (deterministic 10 scenarios)
 * - Supports HARDWARE mode (ESP32 backend telemetry)
 * - Enforces identical data contract and assessment across both modes
 */

import { assessWaterQuality, DEFAULT_RULES_CONFIG } from '../utils/rulesEngine';

const API_BASE = '/api/v1';

export const SCENARIO_PRESETS = [
  { id: 1, name: '1. Low Treatment Requirement (Basic)', desc: 'Clean wash-basin / light rinse water' },
  { id: 2, name: '2. Medium Treatment Requirement (Moderate)', desc: 'Shower / bath water with soaps & turbidity' },
  { id: 3, name: '3. High Treatment Requirement (Intensive)', desc: 'Heavy laundry greywater, high TDS & turbidity' },
  { id: 4, name: '4. Missing pH Sensor (Prototype Setup)', desc: 'Matches student wiring diagram (probe omitted)' },
  { id: 5, name: '5. Sensor Failure (Implausible TDS)', desc: 'Broken probe reporting negative TDS value' },
  { id: 6, name: '6. Stale Readings (Timed Out)', desc: 'Telemetry older than stale threshold (>45s)' },
  { id: 7, name: '7. Device Offline', desc: 'ESP32 disconnected from power/WiFi' },
  { id: 8, name: '8. Treatment Stage Error (Mismatch)', desc: 'Controller reports Stage 2 Relay Fault' },
  { id: 9, name: '9. Post-Treatment Reading Available', desc: 'Dual-sensor setup with before/after comparison' },
  { id: 10, name: '10. Post-Treatment Reading Unavailable', desc: 'Output sensors absent; output cannot be verified' }
];

// Offline deterministic fallback scenarios in case backend is stopped
const LOCAL_MOCK_SCENARIOS = {
  1: {
    device_id: 'GW-001',
    sequence: 101,
    uptime_seconds: 1200,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.2, tds_ppm: 180.0, turbidity_ntu: 3.2, temperature_c: 24.5 },
    treatment: { active_stage: 1, stage_1: 'ACTIVE', stage_2: 'BYPASSED', stage_3: 'BYPASSED', pump_status: 'ON' },
    output_sensors: null
  },
  2: {
    device_id: 'GW-001',
    sequence: 102,
    uptime_seconds: 1260,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.6, tds_ppm: 460.0, turbidity_ntu: 14.8, temperature_c: 27.2 },
    treatment: { active_stage: 2, stage_1: 'COMPLETED', stage_2: 'ACTIVE', stage_3: 'BYPASSED', pump_status: 'ON' },
    output_sensors: null
  },
  3: {
    device_id: 'GW-001',
    sequence: 103,
    uptime_seconds: 1320,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 8.9, tds_ppm: 940.0, turbidity_ntu: 38.5, temperature_c: 29.8 },
    treatment: { active_stage: 3, stage_1: 'COMPLETED', stage_2: 'COMPLETED', stage_3: 'ACTIVE', pump_status: 'ON' },
    output_sensors: null
  },
  4: {
    device_id: 'GW-001',
    sequence: 104,
    uptime_seconds: 1380,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: null, tds_ppm: 220.0, turbidity_ntu: 4.1, temperature_c: 25.1 },
    treatment: { active_stage: 1, stage_1: 'ACTIVE', stage_2: 'BYPASSED', stage_3: 'BYPASSED', pump_status: 'ON' },
    output_sensors: null
  },
  5: {
    device_id: 'GW-001',
    sequence: 105,
    uptime_seconds: 1440,
    source_mode: 'SIMULATED',
    device_status: 'SENSOR_ERROR',
    sensors: { ph: 7.1, tds_ppm: -45.0, turbidity_ntu: 12.0, temperature_c: 26.0 },
    treatment: { active_stage: null, stage_1: 'BYPASSED', stage_2: 'BYPASSED', stage_3: 'BYPASSED', pump_status: 'OFF' },
    output_sensors: null
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
    treatment: { active_stage: 1, stage_1: 'ACTIVE', stage_2: 'BYPASSED', stage_3: 'BYPASSED', pump_status: 'ON' },
    output_sensors: null
  },
  7: {
    device_id: 'GW-001',
    sequence: 107,
    uptime_seconds: 0,
    source_mode: 'SIMULATED',
    device_status: 'OFFLINE',
    is_offline: true,
    sensors: { ph: null, tds_ppm: null, turbidity_ntu: null, temperature_c: null },
    treatment: { active_stage: null, stage_1: 'BYPASSED', stage_2: 'BYPASSED', stage_3: 'BYPASSED', pump_status: 'OFF' },
    output_sensors: null
  },
  8: {
    device_id: 'GW-001',
    sequence: 108,
    uptime_seconds: 1620,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.7, tds_ppm: 490.0, turbidity_ntu: 19.2, temperature_c: 27.5 },
    treatment: { active_stage: 1, stage_1: 'ACTIVE', stage_2: 'FAULT', stage_3: 'BYPASSED', pump_status: 'ON' },
    output_sensors: null
  },
  9: {
    device_id: 'GW-001',
    sequence: 109,
    uptime_seconds: 1680,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.8, tds_ppm: 530.0, turbidity_ntu: 19.5, temperature_c: 28.2 },
    output_sensors: { ph: 7.2, tds_ppm: 210.0, turbidity_ntu: 2.4, temperature_c: 26.9 },
    treatment: { active_stage: 2, stage_1: 'COMPLETED', stage_2: 'COMPLETED', stage_3: 'BYPASSED', pump_status: 'ON' }
  },
  10: {
    device_id: 'GW-001',
    sequence: 110,
    uptime_seconds: 1740,
    source_mode: 'SIMULATED',
    device_status: 'ONLINE',
    sensors: { ph: 7.1, tds_ppm: 290.0, turbidity_ntu: 4.8, temperature_c: 25.0 },
    output_sensors: null,
    treatment: { active_stage: 1, stage_1: 'COMPLETED', stage_2: 'BYPASSED', stage_3: 'BYPASSED', pump_status: 'OFF' }
  }
};

class DataProviderService {
  constructor() {
    this.activeRulesConfig = { ...DEFAULT_RULES_CONFIG };
    this.localHistory = [];
    this.localEvents = [];
  }

  /**
   * Fetch latest telemetry for a given device and mode
   */
  async fetchLatestReading(deviceId = 'GW-001', mode = 'SIMULATED', activeScenarioId = 1) {
    if (mode === 'SIMULATED') {
      // Try sending to backend demo endpoint first so backend database records it
      try {
        const triggerRes = await fetch(`${API_BASE}/demo/trigger/${activeScenarioId}`, { method: 'POST' });
        if (triggerRes.ok) {
          const latestRes = await fetch(`${API_BASE}/devices/${deviceId}/latest`);
          if (latestRes.ok) {
            const data = await latestRes.json();
            return data.data;
          }
        }
      } catch {
        // Backend not reachable, fall back to pure local client simulation
      }

      // Local client fallback
      const scenario = LOCAL_MOCK_SCENARIOS[activeScenarioId] || LOCAL_MOCK_SCENARIOS[1];
      const receivedAt = scenario.is_stale
        ? new Date(Date.now() - (scenario.stale_offset_seconds || 80) * 1000).toISOString()
        : new Date().toISOString();

      const assessment = assessWaterQuality(scenario.sensors, this.activeRulesConfig, {
        is_stale: scenario.is_stale,
        is_offline: scenario.is_offline
      });

      const reading = {
        device_id: deviceId,
        received_at: receivedAt,
        sequence: scenario.sequence,
        sensors: scenario.sensors,
        output_sensors: scenario.output_sensors,
        device_status: scenario.device_status,
        source_mode: 'SIMULATED',
        treatment: scenario.treatment,
        assessment,
        is_stale: Boolean(scenario.is_stale),
        reading_age_seconds: scenario.is_stale ? 80 : 2
      };

      this._recordLocalHistory(reading);
      return reading;
    }

    // HARDWARE MODE
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/latest`);
      if (!res.ok) {
        throw new Error(`Device endpoint returned ${res.status}`);
      }
      const json = await res.json();
      return json.data;
    } catch (err) {
      // In hardware mode, if cannot connect, return OFFLINE / UNREACHABLE reading
      return {
        device_id: deviceId,
        received_at: null,
        sequence: 0,
        sensors: { ph: null, tds_ppm: null, turbidity_ntu: null, temperature_c: null },
        output_sensors: null,
        device_status: 'OFFLINE',
        source_mode: 'HARDWARE',
        treatment: null,
        assessment: assessWaterQuality(null, this.activeRulesConfig, { is_offline: true }),
        is_stale: true,
        reading_age_seconds: 9999,
        error: `Hardware API unreachable: ${err.message}`
      };
    }
  }

  /**
   * Fetch Reading History
   */
  async fetchHistory(deviceId = 'GW-001', mode = 'SIMULATED', limit = 100) {
    if (mode === 'SIMULATED') {
      try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/history?limit=${limit}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) return json.data;
        }
      } catch {
        // Fall back to local history
      }
      return this.localHistory.slice(-limit).reverse();
    }

    // HARDWARE MODE
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/history?limit=${limit}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch Device Status & Connectivity
   */
  async fetchDeviceStatus(deviceId = 'GW-001', mode = 'SIMULATED', activeScenarioId = 1) {
    if (mode === 'SIMULATED') {
      try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/status`);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch {
        // Local fallback
      }

      const scenario = LOCAL_MOCK_SCENARIOS[activeScenarioId] || LOCAL_MOCK_SCENARIOS[1];
      let connectivity = scenario.device_status;
      if (scenario.is_stale) connectivity = 'STALE_DATA';
      if (scenario.is_offline) connectivity = 'OFFLINE';

      return {
        device_id: deviceId,
        device_name: 'Simulated ESP32 Testbed',
        connectivity,
        source_mode: 'SIMULATED',
        last_seen_at: scenario.is_offline ? null : new Date().toISOString()
      };
    }

    // HARDWARE MODE
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/status`);
      if (!res.ok) throw new Error('Status failed');
      const json = await res.json();
      return json.data;
    } catch {
      return {
        device_id: deviceId,
        device_name: 'ESP32 GreyWater Guardian',
        connectivity: 'OFFLINE',
        source_mode: 'HARDWARE',
        last_seen_at: null
      };
    }
  }

  /**
   * Fetch USB Serial Connection Status
   */
  async fetchSerialStatus() {
    try {
      const res = await fetch(`${API_BASE}/serial/status`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Backend or serial unavailable
    }
    return null;
  }

  /**
   * Fetch System Events Log
   */
  async fetchSystemEvents(deviceId = 'GW-001', mode = 'SIMULATED') {
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/events`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch {
      // Fallback
    }

    if (this.localEvents.length === 0) {
      return [
        { id: 1, event_type: 'SYSTEM_BOOT', message: 'GreyWater Guardian initialized in demo mode', severity: 'INFO', created_at: new Date().toISOString() },
        { id: 2, event_type: 'RULES_LOADED', message: 'Loaded default rules version 1.0.0-prototype', severity: 'INFO', created_at: new Date().toISOString() }
      ];
    }
    return this.localEvents;
  }

  /**
   * Get Active Rules Configuration
   */
  async getRulesConfig() {
    try {
      const res = await fetch(`${API_BASE}/rules/config`);
      if (res.ok) {
        const json = await res.json();
        this.activeRulesConfig = json.config;
        return this.activeRulesConfig;
      }
    } catch {
      // Fallback
    }
    return this.activeRulesConfig;
  }

  /**
   * Update Rules Configuration
   */
  async updateRulesConfig(newConfig) {
    this.activeRulesConfig = { ...this.activeRulesConfig, ...newConfig };
    try {
      const res = await fetch(`${API_BASE}/rules/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const json = await res.json();
        return json.config;
      }
    } catch {
      // Fallback
    }
    return this.activeRulesConfig;
  }

  _recordLocalHistory(reading) {
    if (!reading.sensors.tds_ppm && reading.device_status === 'OFFLINE') return;
    this.localHistory.push({
      id: this.localHistory.length + 1,
      device_id: reading.device_id,
      received_at: reading.received_at,
      sequence: reading.sequence,
      ph: reading.sensors.ph,
      tds_ppm: reading.sensors.tds_ppm,
      turbidity_ntu: reading.sensors.turbidity_ntu,
      temperature_c: reading.sensors.temperature_c,
      output_tds_ppm: reading.output_sensors?.tds_ppm ?? null,
      output_turbidity_ntu: reading.output_sensors?.turbidity_ntu ?? null,
      output_temperature_c: reading.output_sensors?.temperature_c ?? null,
      output_ph: reading.output_sensors?.ph ?? null,
      assessment_status: reading.assessment?.assessment_status,
      recommended_treatment_level: reading.assessment?.treatment_level,
      source_mode: reading.source_mode
    });
    if (this.localHistory.length > 200) this.localHistory.shift();
  }
}

export const dataProvider = new DataProviderService();
