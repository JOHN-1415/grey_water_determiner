/**
 * Automated Tests for Serial Telemetry Ingestion & Sensor-Only Assessment System
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateTelemetryPayload } from '../src/validation/telemetryValidation.js';
import { assessWaterQuality } from '../src/services/rulesEngine.js';

describe('Serial Telemetry Ingestion & Hardware Assessment Rules', () => {
  test('1. Validates flat JSON record emitted by ESP32 USB serial (sensor-only, no pump)', () => {
    const flatRecord = {
      device_id: 'GW-001',
      sequence: 1,
      temperature_c: 27.5,
      tds_ppm: 420.0,
      turbidity_ntu: 12.4,
      classification: 'LEVEL_2',
      source_mode: 'HARDWARE'
    };

    const res = validateTelemetryPayload(flatRecord);
    assert.equal(res.isValid, true);
    assert.equal(res.data.device_id, 'GW-001');
    assert.equal(res.data.sequence, 1);
    assert.equal(res.data.sensors.temperature_c, 27.5);
    assert.equal(res.data.sensors.tds_ppm, 420.0);
    assert.equal(res.data.sensors.turbidity_ntu, 12.4);
    assert.equal(res.data.classification, 'LEVEL_2');
    assert.equal(res.data.sensor_validity.tds_ppm, true);
    assert.equal(res.data.sensor_validity.turbidity_ntu, true);
    assert.equal(res.data.treatment, undefined); // Obsolete treatment object excluded
  });

  test('2. Handles disconnected DS18B20 (temperature_c is null) without substituting 25°C', () => {
    const disconnectedTempRecord = {
      device_id: 'GW-001',
      sequence: 2,
      temperature_c: null, // Disconnected probe
      tds_ppm: 210.0,
      turbidity_ntu: 3.2,
      classification: 'LEVEL_1',
      source_mode: 'HARDWARE'
    };

    const val = validateTelemetryPayload(disconnectedTempRecord);
    assert.equal(val.isValid, true);
    assert.equal(val.data.sensors.temperature_c, null);
    assert.equal(val.data.sensor_validity.temperature_c, false);

    const assessment = assessWaterQuality(val.data.sensors);
    // Assessment proceeds using Turbidity & TDS
    assert.equal(assessment.treatment_level, 'LEVEL_1');
    assert.equal(assessment.parameter_details.temperature_c.status, 'UNAVAILABLE_DISCONNECTED');
    assert.equal(assessment.parameter_details.temperature_c.value, null);
  });

  test('3. Rejects implausible negative TDS reading and returns UNKNOWN', () => {
    const invalidTdsRecord = {
      device_id: 'GW-001',
      sequence: 3,
      temperature_c: 25.0,
      tds_ppm: -50.0, // Implausible negative
      turbidity_ntu: 4.0
    };

    const val = validateTelemetryPayload(invalidTdsRecord);
    assert.equal(val.isValid, false);
    assert.ok(val.errors.some((e) => /outside plausible range/i.test(e)));
  });

  test('4. Correctly classifies LEVEL_2 when turbidity exceeds basic limit', () => {
    const sensors = {
      temperature_c: 26.0,
      tds_ppm: 250.0,
      turbidity_ntu: 14.5 // > 5 NTU
    };

    const assessment = assessWaterQuality(sensors);
    assert.equal(assessment.treatment_level, 'LEVEL_2');
    assert.ok(assessment.parameters_outside_criteria.includes('turbidity_ntu'));
    assert.equal(assessment.recommendation.assigned_level, 'LEVEL_2');
  });

  test('5. Correctly classifies LEVEL_3 when TDS exceeds moderate limit', () => {
    const sensors = {
      temperature_c: 28.0,
      tds_ppm: 920.0, // > 800 ppm
      turbidity_ntu: 4.0
    };

    const assessment = assessWaterQuality(sensors);
    assert.equal(assessment.treatment_level, 'LEVEL_3');
    assert.ok(assessment.parameters_outside_criteria.includes('tds_ppm'));
    assert.equal(assessment.recommendation.assigned_level, 'LEVEL_3');
  });
});
