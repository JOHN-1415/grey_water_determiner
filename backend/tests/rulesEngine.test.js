/**
 * Automated Tests for GreyWater Guardian Rules Engine
 * IoT Greywater Quality Assessment & Recommendation System
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assessWaterQuality, DEFAULT_RULES_CONFIG, getScientificLimitations } from '../src/services/rulesEngine.js';

describe('Rules Engine — Water Quality Assessment & Recommendations', () => {
  test('1. Recommends LEVEL_1 when all parameters meet basic criteria', () => {
    const sensors = {
      ph: 7.2,
      tds_ppm: 210,
      turbidity_ntu: 3.5,
      temperature_c: 24.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'LEVEL_1');
    assert.equal(result.assessment_status, 'NORMAL');
    assert.ok(result.explanation.includes('Level 1'));
    assert.equal(result.parameters_outside_criteria.length, 0);
    assert.ok(result.recommendation);
    assert.equal(result.recommendation.assigned_level, 'LEVEL_1');
    assert.ok(result.recommendation.suggested_treatment_methods.length > 0);
  });

  test('2. Recommends LEVEL_2 when turbidity exceeds basic threshold', () => {
    const sensors = {
      ph: 7.4,
      tds_ppm: 250,
      turbidity_ntu: 15.0, // > 5.0 NTU limit
      temperature_c: 25.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'LEVEL_2');
    assert.equal(result.assessment_status, 'MODERATE_CONTAMINATION');
    assert.ok(result.parameters_outside_criteria.includes('turbidity_ntu'));
    assert.ok(/turbidity/i.test(result.explanation));
    assert.equal(result.recommendation.assigned_level, 'LEVEL_2');
  });

  test('3. Recommends LEVEL_3 when TDS and Turbidity indicate heavy contamination', () => {
    const sensors = {
      ph: 8.9,
      tds_ppm: 950, // > 800 ppm
      turbidity_ntu: 45.0, // > 25 NTU
      temperature_c: 28.0
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'LEVEL_3');
    assert.equal(result.assessment_status, 'HIGH_CONTAMINATION');
    assert.ok(result.parameters_outside_criteria.includes('tds_ppm'));
    assert.ok(result.parameters_outside_criteria.includes('turbidity_ntu'));
    assert.equal(result.recommendation.assigned_level, 'LEVEL_3');
  });

  test('4. Correctly assesses water when optional pH is NULL (matches prototype hardware)', () => {
    const sensors = {
      ph: null, // pH probe omitted
      tds_ppm: 190,
      turbidity_ntu: 2.9,
      temperature_c: 23.5
    };

    const result = assessWaterQuality(sensors);
    assert.equal(result.treatment_level, 'LEVEL_1');
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
    assert.equal(result.recommendation.assigned_level, 'UNKNOWN');
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
  });

  test('7. Flags stale telemetry and does not approve lowest treatment', () => {
    const sensors = {
      ph: 7.1,
      tds_ppm: 180,
      turbidity_ntu: 2.0,
      temperature_c: 22.0
    };

    const result = assessWaterQuality(sensors, null, { is_stale: true });
    assert.equal(result.treatment_level, 'UNKNOWN');
    assert.equal(result.assessment_status, 'STALE_DATA');
  });

  test('8. Treats temperature as contextual without independently setting treatment level', () => {
    const sensorsWarm = {
      ph: null,
      tds_ppm: 200, // Meets Level 1
      turbidity_ntu: 3.0, // Meets Level 1
      temperature_c: 48.0 // Warm greywater
    };

    const result = assessWaterQuality(sensorsWarm);
    // Treatment level remains Level 1 based on TDS and Turbidity
    assert.equal(result.treatment_level, 'LEVEL_1');
    assert.equal(result.parameter_details.temperature_c.status, 'NORMAL_RANGE');
    assert.ok(result.parameter_details.temperature_c.context.includes('Temperature'));
  });

  test('9. Includes mandatory scientific and regulatory limitations in recommendations', () => {
    const limits = getScientificLimitations();
    assert.equal(limits.length, 4);
    assert.ok(limits.some((l) => /microbiological/i.test(l)));
    assert.ok(limits.some((l) => /potability/i.test(l)));
    assert.ok(limits.some((l) => /does not physically purify/i.test(l)));
  });
});
