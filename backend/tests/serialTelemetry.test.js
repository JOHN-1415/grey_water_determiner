/**
 * Automated Tests for Serial Telemetry Ingestion & Real Hardware Constraints
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateTelemetryPayload } from '../src/validation/telemetryValidation.js';
import { assessWaterQuality } from '../src/services/rulesEngine.js';

describe('Serial Telemetry Ingestion & Hardware Prototype Rules', () => {
  test('1. Validates flat JSON record emitted by ESP32 USB serial', () => {
    const flatRecord = {
      device_id: 'GW-001',
      sequence: 1,
      temperature_c: 27.5,
      tds_ppm: 420.0,
      turbidity_ntu: 12.4,
      classification: 'MEDIUM',
      pump_status: 'ON',
      source_mode: 'HARDWARE'
    };

    const res = validateTelemetryPayload(flatRecord);
    assert.equal(res.isValid, true);
    assert.equal(res.data.device_id, 'GW-001');
    assert.equal(res.data.sequence, 1);
    assert.equal(res.data.sensors.temperature_c, 27.5);
    assert.equal(res.data.sensors.tds_ppm, 420.0);
    assert.equal(res.data.sensors.turbidity_ntu, 12.4);
    assert.equal(res.data.treatment.pump_status, 'ON');
    assert.equal(res.data.treatment.active_stage, 1);
    // Physical prototype constraint: Stages 2 and 3 are NOT physically installed
    assert.equal(res.data.treatment.stage_2, 'NOT_INSTALLED');
    assert.equal(res.data.treatment.stage_3, 'NOT_INSTALLED');
  });

  test('2. Handles disconnected DS18B20 (temperature_c is null) without substituting 25°C', () => {
    const disconnectedTempRecord = {
      device_id: 'GW-001',
      sequence: 2,
      temperature_c: null, // Disconnected probe
      tds_ppm: 210.0,
      turbidity_ntu: 3.2,
      classification: 'BASIC',
      pump_status: 'ON',
      source_mode: 'HARDWARE'
    };

    const val = validateTelemetryPayload(disconnectedTempRecord);
    assert.equal(val.isValid, true);
    assert.equal(val.data.sensors.temperature_c, null);

    const assessment = assessWaterQuality(val.data.sensors);
    // Classification proceeds using Turbidity & TDS
    assert.equal(assessment.treatment_level, 'BASIC');
    assert.equal(assessment.parameter_details.temperature_c.status, 'UNAVAILABLE_DISCONNECTED');
    assert.equal(assessment.parameter_details.temperature_c.value, null);
  });

  test('3. Rejects implausible negative TDS reading and returns UNKNOWN', () => {
    const invalidTdsRecord = {
      device_id: 'GW-001',
      sequence: 3,
      temperature_c: 25.0,
      tds_ppm: -50.0, // Implausible negative
      turbidity_ntu: 4.0,
      pump_status: 'OFF'
    };

    const val = validateTelemetryPayload(invalidTdsRecord);
    assert.equal(val.isValid, false);
    assert.ok(val.errors.some((e) => /outside plausible range/i.test(e)));
  });

  test('4. Correctly classifies MEDIUM when turbidity exceeds basic limit (exceeds single-stage physical prototype)', () => {
    const sensors = {
      temperature_c: 26.0,
      tds_ppm: 250.0,
      turbidity_ntu: 14.5 // > 5 NTU
    };

    const assessment = assessWaterQuality(sensors);
    assert.equal(assessment.treatment_level, 'MEDIUM');
    assert.ok(assessment.parameters_outside_criteria.includes('turbidity_ntu'));
  });

  test('5. Correctly classifies HIGH when TDS exceeds medium limit (exceeds single-stage physical prototype)', () => {
    const sensors = {
      temperature_c: 28.0,
      tds_ppm: 920.0, // > 800 ppm
      turbidity_ntu: 4.0
    };

    const assessment = assessWaterQuality(sensors);
    assert.equal(assessment.treatment_level, 'HIGH');
    assert.ok(assessment.parameters_outside_criteria.includes('tds_ppm'));
  });
});
