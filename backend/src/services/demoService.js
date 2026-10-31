/**
 * Demo Scenario Service for GreyWater Guardian
 * IoT Greywater Quality Assessment & Recommendation System
 *
 * Implements 10 realistic assessment scenarios:
 * 1. Low Contamination (Level 1: Basic Treatment Recommendation)
 * 2. Moderate Contamination (Level 2: Moderate Treatment Recommendation)
 * 3. High Contamination (Level 3: Advanced Treatment Recommendation)
 * 4. Missing pH Sensor (Matches physical prototype where probe is omitted)
 * 5. Sensor Fault (Implausible negative TDS value triggers UNKNOWN safe hold)
 * 6. Stale Telemetry (Telemetry timed out)
 * 7. Device Offline (ESP32 disconnected)
 * 8. Severe Turbidity Surge (Extreme particulate load triggers Level 3)
 * 9. Disconnected DS18B20 Temp Probe (Probe unplugged, reported as null)
 * 10. Thermal Context Greywater (Elevated 48°C wash water with Level 2 recommendation)
 */

export const DEMO_SCENARIOS = {
  1: {
    id: 1,
    name: '1. Low Contamination (Level 1: Basic)',
    description: 'Light wash basin / hand wash rinse water. Turbidity and TDS meet basic criteria.',
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
      classification: 'LEVEL_1'
    }
  },
  2: {
    id: 2,
    name: '2. Moderate Contamination (Level 2: Moderate)',
    description: 'Shower and bath greywater containing moderate dissolved soaps and turbidity.',
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
      classification: 'LEVEL_2'
    }
  },
  3: {
    id: 3,
    name: '3. High Contamination (Level 3: Advanced)',
    description: 'Heavy laundry wash greywater with high turbidity, surfactants, and TDS.',
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
      classification: 'LEVEL_3'
    }
  },
  4: {
    id: 4,
    name: '4. Missing pH Sensor (Prototype Setup)',
    description: 'Matches physical prototype where pH probe is omitted; assesses using TDS and Turbidity.',
    payload: {
      device_id: 'GW-001',
      sequence: 104,
      uptime_seconds: 1380,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: null,
        tds_ppm: 220.0,
        turbidity_ntu: 4.1,
        temperature_c: 25.1
      },
      classification: 'LEVEL_1'
    }
  },
  5: {
    id: 5,
    name: '5. Sensor Failure (Implausible TDS)',
    description: 'Hardware probe anomaly reporting impossible negative TDS value; system enters UNKNOWN safe hold.',
    payload: {
      device_id: 'GW-001',
      sequence: 105,
      uptime_seconds: 1440,
      source_mode: 'SIMULATED',
      device_status: 'SENSOR_ERROR',
      sensors: {
        ph: 7.1,
        tds_ppm: -45.0,
        turbidity_ntu: 12.0,
        temperature_c: 26.0
      },
      classification: 'UNKNOWN'
    }
  },
  6: {
    id: 6,
    name: '6. Stale Telemetry (Communication Delay)',
    description: 'Telemetry older than stale threshold (>30s); flags stale state and halts recommendation.',
    payload: {
      device_id: 'GW-001',
      sequence: 106,
      uptime_seconds: 1500,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      is_stale_simulation: true,
      stale_offset_seconds: 80,
      sensors: {
        ph: 7.3,
        tds_ppm: 310.0,
        turbidity_ntu: 8.5,
        temperature_c: 26.4
      },
      classification: 'UNKNOWN'
    }
  },
  7: {
    id: 7,
    name: '7. Device Offline',
    description: 'ESP32 disconnected from power or USB; system marks device offline.',
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
      classification: 'UNKNOWN'
    }
  },
  8: {
    id: 8,
    name: '8. Severe Turbidity Surge (Heavy Particulates)',
    description: 'Extreme turbidity (65 NTU) from floor cleaning greywater triggering Level 3.',
    payload: {
      device_id: 'GW-001',
      sequence: 108,
      uptime_seconds: 1620,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 8.1,
        tds_ppm: 420.0,
        turbidity_ntu: 65.0,
        temperature_c: 27.0
      },
      classification: 'LEVEL_3'
    }
  },
  9: {
    id: 9,
    name: '9. Disconnected DS18B20 Temp Probe',
    description: 'DS18B20 temperature probe unplugged (null); system continues assessment without faking 25°C.',
    payload: {
      device_id: 'GW-001',
      sequence: 109,
      uptime_seconds: 1680,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: null,
        tds_ppm: 260.0,
        turbidity_ntu: 3.8,
        temperature_c: null // Unplugged DS18B20
      },
      classification: 'LEVEL_1'
    }
  },
  10: {
    id: 10,
    name: '10. Warm Greywater Thermal Context',
    description: 'Hot laundry/shower rinse at 48°C; recorded as contextual warmth without independently changing filtration level.',
    payload: {
      device_id: 'GW-001',
      sequence: 110,
      uptime_seconds: 1740,
      source_mode: 'SIMULATED',
      device_status: 'ONLINE',
      sensors: {
        ph: 7.7,
        tds_ppm: 410.0,
        turbidity_ntu: 11.2,
        temperature_c: 48.0 // Contextual warmth
      },
      classification: 'LEVEL_2'
    }
  }
};

export function listScenarios() {
  return Object.values(DEMO_SCENARIOS).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));
}

export function getScenario(id) {
  const scenario = DEMO_SCENARIOS[Number(id)];
  if (!scenario) {
    throw new Error(`Scenario ID '${id}' not found`);
  }
  return scenario;
}
