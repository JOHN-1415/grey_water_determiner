/**
 * Demo Scenario Service for GreyWater Guardian
 *
 * Implements the 10 required simulation scenarios deterministically:
 * 1. Low treatment requirement
 * 2. Medium treatment requirement
 * 3. High treatment requirement
 * 4. Missing pH sensor
 * 5. Sensor failure
 * 6. Stale readings
 * 7. Device offline
 * 8. Treatment stage error
 * 9. Post-treatment reading available
 * 10. Post-treatment reading unavailable
 */

export const DEMO_SCENARIOS = {
  1: {
    id: 1,
    name: 'Low Treatment Requirement (Basic)',
    description: 'Clean wash-basin / light rinse water meeting basic standards.',
    payload: {
      device_id: 'GW-001',
      sequence: 101,
      uptime_seconds: 1200,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 7.2,
        tds_ppm: 180.0,
        turbidity_ntu: 3.2,
        temperature_c: 24.5
      },
      treatment: {
        active_stage: 1,
        stage_1: 'ACTIVE',
        stage_2: 'BYPASSED',
        stage_3: 'BYPASSED',
        pump_status: 'ON'
      },
      output_sensors: null
    }
  },
  2: {
    id: 2,
    name: 'Medium Treatment Requirement (Moderate)',
    description: 'Shower / bath water with moderate soaps and turbidity.',
    payload: {
      device_id: 'GW-001',
      sequence: 102,
      uptime_seconds: 1260,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 7.6,
        tds_ppm: 460.0,
        turbidity_ntu: 14.8,
        temperature_c: 27.2
      },
      treatment: {
        active_stage: 2,
        stage_1: 'COMPLETED',
        stage_2: 'ACTIVE',
        stage_3: 'BYPASSED',
        pump_status: 'ON'
      },
      output_sensors: null
    }
  },
  3: {
    id: 3,
    name: 'High Treatment Requirement (Intensive)',
    description: 'Heavy laundry greywater with high turbidity, surfactants & TDS.',
    payload: {
      device_id: 'GW-001',
      sequence: 103,
      uptime_seconds: 1320,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 8.9,
        tds_ppm: 940.0,
        turbidity_ntu: 38.5,
        temperature_c: 29.8
      },
      treatment: {
        active_stage: 3,
        stage_1: 'COMPLETED',
        stage_2: 'COMPLETED',
        stage_3: 'ACTIVE',
        pump_status: 'ON'
      },
      output_sensors: null
    }
  },
  4: {
    id: 4,
    name: 'Missing pH Sensor (Optional Hardware Omitted)',
    description: 'Matches prototype setup where pH probe is omitted from ESP32.',
    payload: {
      device_id: 'GW-001',
      sequence: 104,
      uptime_seconds: 1380,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: null, // explicit null
        tds_ppm: 220.0,
        turbidity_ntu: 4.1,
        temperature_c: 25.1
      },
      treatment: {
        active_stage: 1,
        stage_1: 'ACTIVE',
        stage_2: 'BYPASSED',
        stage_3: 'BYPASSED',
        pump_status: 'ON'
      },
      output_sensors: null
    }
  },
  5: {
    id: 5,
    name: 'Sensor Failure (Implausible / Disconnected)',
    description: 'Broken TDS sensor reporting negative reading (-45 ppm).',
    payload: {
      device_id: 'GW-001',
      sequence: 105,
      uptime_seconds: 1440,
      source_mode: 'SIMULATED',
      device_status: 'SENSOR_ERROR',
      sensors: {
        ph: 7.1,
        tds_ppm: -45.0, // Invalid implausible reading
        turbidity_ntu: 12.0,
        temperature_c: 26.0
      },
      treatment: {
        active_stage: null,
        stage_1: 'BYPASSED',
        stage_2: 'BYPASSED',
        stage_3: 'BYPASSED',
        pump_status: 'OFF'
      },
      output_sensors: null
    }
  },
  6: {
    id: 6,
    name: 'Stale Readings (Telemetry Timed Out)',
    description: 'Telemetry received over 50 seconds ago without updates.',
    payload: {
      device_id: 'GW-001',
      sequence: 106,
      uptime_seconds: 1500,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      is_stale_simulation: true,
      stale_offset_seconds: 75,
      sensors: {
        ph: 7.3,
        tds_ppm: 310.0,
        turbidity_ntu: 8.5,
        temperature_c: 26.4
      },
      treatment: {
        active_stage: 1,
        stage_1: 'ACTIVE',
        stage_2: 'BYPASSED',
        stage_3: 'BYPASSED',
        pump_status: 'ON'
      },
      output_sensors: null
    }
  },
  7: {
    id: 7,
    name: 'Device Offline',
    description: 'ESP32 controller disconnected from power or WiFi.',
    payload: {
      device_id: 'GW-001',
      sequence: 107,
      uptime_seconds: 0,
      source_mode: 'SIMULATED',
      device_status: 'OFFLINE',
      is_offline_simulation: true,
      sensors: {
        ph: null,
        tds_ppm: null,
        turbidity_ntu: null,
        temperature_c: null
      },
      treatment: {
        active_stage: null,
        stage_1: 'BYPASSED',
        stage_2: 'BYPASSED',
        stage_3: 'BYPASSED',
        pump_status: 'OFF'
      },
      output_sensors: null
    }
  },
  8: {
    id: 8,
    name: 'Treatment Stage Error (Stage Mismatch)',
    description: 'Medium treatment recommended, but hardware reports Stage 2 Relay Error.',
    payload: {
      device_id: 'GW-001',
      sequence: 108,
      uptime_seconds: 1620,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 7.7,
        tds_ppm: 490.0,
        turbidity_ntu: 19.2,
        temperature_c: 27.5
      },
      treatment: {
        active_stage: 1, // Controller stuck at stage 1
        stage_1: 'ACTIVE',
        stage_2: 'FAULT', // Valve / Relay fault reported
        stage_3: 'BYPASSED',
        pump_status: 'ON'
      },
      output_sensors: null
    }
  },
  9: {
    id: 9,
    name: 'Post-Treatment Reading Available',
    description: 'Dual-sensor setup: verifies filtration efficacy before non-potable reuse.',
    payload: {
      device_id: 'GW-001',
      sequence: 109,
      uptime_seconds: 1680,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 7.8,
        tds_ppm: 530.0,
        turbidity_ntu: 19.5,
        temperature_c: 28.2
      },
      output_sensors: {
        ph: 7.2,
        tds_ppm: 210.0,
        turbidity_ntu: 2.4,
        temperature_c: 26.9
      },
      treatment: {
        active_stage: 2,
        stage_1: 'COMPLETED',
        stage_2: 'COMPLETED',
        stage_3: 'BYPASSED',
        pump_status: 'ON'
      }
    }
  },
  10: {
    id: 10,
    name: 'Post-Treatment Reading Unavailable',
    description: 'Hardware does not have output sensors installed; output cannot be verified.',
    payload: {
      device_id: 'GW-001',
      sequence: 110,
      uptime_seconds: 1740,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 7.1,
        tds_ppm: 290.0,
        turbidity_ntu: 4.8,
        temperature_c: 25.0
      },
      output_sensors: null, // explicit null
      treatment: {
        active_stage: 1,
        stage_1: 'COMPLETED',
        stage_2: 'BYPASSED',
        stage_3: 'BYPASSED',
        pump_status: 'OFF'
      }
    }
  }
};

/**
 * Get Scenario by ID
 */
export function getScenario(scenarioId) {
  const id = Number(scenarioId);
  return DEMO_SCENARIOS[id] || DEMO_SCENARIOS[1];
}

/**
 * List all scenarios for frontend switcher
 */
export function listScenarios() {
  return Object.values(DEMO_SCENARIOS).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));
}
