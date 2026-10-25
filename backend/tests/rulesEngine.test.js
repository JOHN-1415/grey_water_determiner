/**
 * Automated Tests for GreyWater Guardian Rules Engine
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assessWaterQuality, DEFAULT_RULES_CONFIG } from '../src/services/rulesEngine.js';

describe('Rules Engine - Water Quality Assessment', () => {
  test('1. Recommends BASIC when all parameters meet basic criteria', () => {
    const sensors = {
      ph: 7.2,
      tds_ppm: 210,
      turbidity_ntu: 3.5,
      temperature_c: 24.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'BASIC');
    assert.equal(result.assessment_status, 'NORMAL');
    assert.equal(result.stage_mapping.stage_1, 'ACTIVE');
    assert.equal(result.stage_mapping.stage_2, 'BYPASSED');
    assert.equal(result.stage_mapping.stage_3, 'BYPASSED');
    assert.ok(result.explanation.includes('Basic treatment'));
    assert.equal(result.parameters_outside_criteria.length, 0);
  });

  test('2. Recommends MEDIUM when turbidity exceeds basic threshold', () => {
    const sensors = {
      ph: 7.4,
      tds_ppm: 250,
      turbidity_ntu: 15.0, // > 5.0 NTU basic limit
      temperature_c: 25.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'MEDIUM');
    assert.equal(result.assessment_status, 'MODERATE_CONTAMINATION');
    assert.equal(result.stage_mapping.stage_1, 'ACTIVE');
    assert.equal(result.stage_mapping.stage_2, 'ACTIVE');
    assert.equal(result.stage_mapping.stage_3, 'BYPASSED');
    assert.ok(result.parameters_outside_criteria.includes('turbidity_ntu'));
    assert.ok(/turbidity/i.test(result.explanation));
  });

  test('3. Recommends HIGH when TDS and Turbidity indicate heavy contamination', () => {
    const sensors = {
      ph: 8.9,
      tds_ppm: 950, // > 800 ppm
      turbidity_ntu: 45.0, // > 25 NTU
      temperature_c: 28.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'HIGH');
    assert.equal(result.assessment_status, 'HIGH_CONTAMINATION');
    assert.equal(result.stage_mapping.stage_1, 'ACTIVE');
    assert.equal(result.stage_mapping.stage_2, 'ACTIVE');
    assert.equal(result.stage_mapping.stage_3, 'ACTIVE');
    assert.ok(result.parameters_outside_criteria.includes('tds_ppm'));
    assert.ok(result.parameters_outside_criteria.includes('turbidity_ntu'));
  });

  test('4. Correctly assesses water when optional pH is NULL (matches prototype hardware)', () => {
    const sensors = {
      ph: null, // pH probe omitted
      tds_ppm: 190,
      turbidity_ntu: 2.9,
      temperature_c: 23.5
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'BASIC');
    assert.equal(result.parameter_details.ph.status, 'OPTIONAL_UNINSTALLED');
    assert.ok(result.parameters_considered.includes('tds_ppm'));
    assert.ok(result.parameters_considered.includes('turbidity_ntu'));
    assert.ok(!result.parameters_considered.includes('ph'));
  });

  test('5. Rejects missing required parameters and returns UNKNOWN (does not assume lowest treatment)', () => {
    const sensors = {
      ph: 7.0,
      tds_ppm: null, // Missing required TDS
      turbidity_ntu: 4.0,
      temperature_c: 24.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'UNKNOWN');
    assert.equal(result.assessment_status, 'SENSOR_ERROR');
    assert.ok(result.explanation.includes('Lowest treatment is NOT assumed'));
    assert.equal(result.stage_mapping.stage_1, 'BYPASSED');
  });

  test('6. Rejects implausible sensor readings (negative TDS)', () => {
    const sensors = {
      ph: 7.0,
      tds_ppm: -20, // Impossible negative TDS
      turbidity_ntu: 4.0,
      temperature_c: 24.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'UNKNOWN');
    assert.equal(result.assessment_status, 'SENSOR_ERROR');
    assert.ok(result.explanation.includes('missing or invalid'));
  });

  test('7. Flags stale telemetry and does not approve lowest treatment', () => {
    const sensors = {
      ph: 7.2,
      tds_ppm: 150,
      turbidity_ntu: 2.0,
      temperature_c: 24.0
    };

    const result = assessWaterQuality(sensors, null, { is_stale: true });
    assert.equal(result.treatment_level, 'UNKNOWN');
    assert.equal(result.assessment_status, 'STALE_DATA');
    assert.ok(result.explanation.includes('STALE'));
  });

  test('8. Handles offline device metadata', () => {
    const sensors = {
      ph: 7.2,
      tds_ppm: 150,
      turbidity_ntu: 2.0,
      temperature_c: 24.0
    };

    const result = assessWaterQuality(sensors, null, { is_offline: true });
    assert.equal(result.treatment_level, 'UNKNOWN');
    assert.equal(result.assessment_status, 'OFFLINE');
    assert.ok(result.explanation.includes('OFFLINE'));
  });

  test('9. Supports configurable rule thresholds', () => {
    // Custom config with stricter turbidity limit (2.0 NTU instead of 5.0)
    const customConfig = {
      ...DEFAULT_RULES_CONFIG,
      version: '2.0.0-strict',
      thresholds: {
        ...DEFAULT_RULES_CONFIG.thresholds,
        turbidity_ntu: {
          optional: false,
          basic_max: 2.0, // Stricter
          medium_max: 10.0
        }
      }
    };

    const sensors = {
      ph: 7.2,
      tds_ppm: 200,
      turbidity_ntu: 3.5, // 3.5 is > 2.0, so should trigger MEDIUM under strict config
      temperature_c: 24.0
    };

    const defaultResult = assessWaterQuality(sensors, DEFAULT_RULES_CONFIG);
    assert.equal(defaultResult.treatment_level, 'BASIC');

    const customResult = assessWaterQuality(sensors, customConfig);
    assert.equal(customResult.treatment_level, 'MEDIUM');
    assert.equal(customResult.rules_version, '2.0.0-strict');
  });
});
