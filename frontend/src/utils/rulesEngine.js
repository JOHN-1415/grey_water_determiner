/**
 * GreyWater Guardian — Client-Side Water Quality Assessment & Recommendation Engine
 * Mirrors backend rulesEngine.js for complete offline PWA functionality.
 */

export const DEFAULT_RULES_CONFIG = {
  version: '2.0.0-assessment',
  description: 'Prototype IoT non-potable greywater assessment and treatment recommendation criteria',
  disclaimer: 'PROTOTYPE CRITERIA NOTICE: These thresholds represent experimental baseline parameters requiring laboratory validation. They do not represent certified drinking water or regulatory environmental standards.',
  thresholds: {
    ph: {
      optional: true,
      basic_min: 6.5,
      basic_max: 8.5,
      medium_min: 6.0,
      medium_max: 9.0
    },
    tds_ppm: {
      optional: false,
      level_1_max: 300.0,
      level_2_max: 800.0,
      basic_max: 300.0,
      medium_max: 800.0
    },
    turbidity_ntu: {
      optional: false,
      level_1_max: 5.0,
      level_2_max: 25.0,
      basic_max: 5.0,
      medium_max: 25.0
    },
    temperature_c: {
      optional: true,
      contextual_only: true,
      nominal_min: 10.0,
      nominal_max: 45.0,
      warning_max: 60.0
    }
  },
  treatment_recommendations: {
    LEVEL_1: {
      title: 'Level 1: Basic Treatment Recommendation',
      summary: 'Water has low turbidity and dissolved solids. Suitable for simple physical pre-filtration before restricted non-potable reuse.',
      suggested_methods: [
        'Coarse mesh screening (100–200 µm) for hair, lint, and suspended matter',
        'Gravity sedimentation / settling trap',
        'Basic dual-media sand/gravel filter bed'
      ],
      suitable_non_potable_uses: [
        'Subsurface landscape & ornamental garden irrigation',
        'Toilet and urinal flushing (with basic dye)',
        'Exterior dust suppression and washing'
      ],
      cautionary_notes: 'Do not use for edible crop contact, sprinkler spray (aerosol risk), or potable drinking.'
    },
    LEVEL_2: {
      title: 'Level 2: Moderate Treatment Recommendation',
      summary: 'Water exhibits moderate turbidity or dissolved organics/soaps. Requires physical filtration combined with adsorption.',
      suggested_methods: [
        'Fine mesh / cartridge pre-filtration (20–50 µm)',
        'Granular Activated Carbon (GAC) adsorption for surfactant, detergent, and odor removal',
        'Multi-barrier slow sand filtration'
      ],
      suitable_non_potable_uses: [
        'Subsurface irrigation for non-food shrubs, trees, and lawns',
        'Controlled commercial toilet flushing',
        'Vehicle washing under containment'
      ],
      cautionary_notes: 'Untreated surfactants can foul soil permeability. Secondary disinfection recommended before indoor non-potable storage.'
    },
    LEVEL_3: {
      title: 'Level 3: Advanced Treatment Recommendation',
      summary: 'Heavy particulate load, chemical surfactants, or high TDS detected. Requires intensive multi-barrier treatment before any reuse.',
      suggested_methods: [
        'Coagulation / flocculation and advanced secondary settling',
        'Ultrafiltration (UF) or microfiltration membrane barrier',
        'Extensive activated carbon bed with regular regeneration',
        'Advanced oxidation / UV disinfection or chlorination'
      ],
      suitable_non_potable_uses: [
        'Restricted industrial cooling tower make-up (post-demineralization)',
        'Heavy non-food agricultural reuse under professional supervision',
        'Discharge to municipal sewer if reuse treatment facilities are unavailable'
      ],
      cautionary_notes: 'Direct reuse without certified tertiary treatment presents biological and environmental risks.'
    },
    UNKNOWN: {
      title: 'Unknown / Insufficient Data — Safe Hold',
      summary: 'Sensor telemetry is missing, timed out, or implausible. Treatment level cannot be determined.',
      suggested_methods: [
        'Inspect physical probe connections (DS18B20, TDS, Turbidity)',
        'Verify sensor calibration in clean standard solutions',
        'Hold water in diversion / buffer tank until telemetry stabilizes'
      ],
      suitable_non_potable_uses: [
        'None permitted until valid water quality assessment is completed'
      ],
      cautionary_notes: 'System in safe hold. Lowest treatment is NOT assumed.'
    }
  }
};

export function getScientificLimitations() {
  return [
    'Sensor Scope Limitation: Installed sensors measure only select physical/chemical indicators (turbidity, TDS, and temperature). They do NOT measure BOD, COD, heavy metals, or chemical toxins.',
    'No Potability Certification: This system does NOT evaluate drinking water safety or certify water for human consumption.',
    'No Microbiological Safety Confirmation: Physical turbidity and TDS sensors CANNOT detect pathogens, viruses, or coliform bacteria (E. coli, Legionella). Disinfection cannot be confirmed.',
    'Informational Recommendation Only: The prototype does NOT physically purify water. Recommendations are analytical guidance and do not guarantee statutory non-potable reuse compliance.'
  ];
}

export function getSafetyDisclaimer() {
  return 'ENVIRONMENTAL & SAFETY NOTICE: Water classified by this system is intended strictly for controlled non-potable analysis. This prototype does NOT physically filter water, does NOT certify drinking water potability, and does NOT confirm microbiological safety.';
}

export function buildRecommendation(classification, sensorDetails, reasons = []) {
  const guide = DEFAULT_RULES_CONFIG.treatment_recommendations[classification] || DEFAULT_RULES_CONFIG.treatment_recommendations.UNKNOWN;
  
  return {
    assigned_level: classification,
    title: guide.title,
    summary: guide.summary,
    reasons,
    relevant_sensors: sensorDetails,
    suggested_treatment_methods: guide.suggested_methods,
    suitable_non_potable_uses: guide.suitable_non_potable_uses,
    cautionary_notes: guide.cautionary_notes,
    scientific_limitations: getScientificLimitations(),
    disclaimer: getSafetyDisclaimer()
  };
}

export function assessWaterQuality(sensors, customConfig = null, metadata = {}) {
  const config = customConfig || DEFAULT_RULES_CONFIG;
  const thresholds = config.thresholds;
  const timestamp = new Date().toISOString();

  if (metadata.is_offline) {
    const rec = buildRecommendation('UNKNOWN', {}, ['Device is OFFLINE; no telemetry available.']);
    return {
      treatment_level: 'UNKNOWN',
      legacy_treatment_level: 'UNKNOWN',
      assessment_status: 'OFFLINE',
      timestamp,
      parameters_considered: [],
      parameters_outside_criteria: [],
      parameter_details: {},
      errors: ['Device is offline'],
      explanation: 'Device is OFFLINE. Cannot perform water quality assessment.',
      recommendation: rec,
      stage_mapping: { stage_1: 'BYPASSED', stage_2: 'BYPASSED', stage_3: 'BYPASSED' },
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  if (metadata.is_stale) {
    const rec = buildRecommendation('UNKNOWN', {}, ['Sensor telemetry timed out (>30s old).']);
    return {
      treatment_level: 'UNKNOWN',
      legacy_treatment_level: 'UNKNOWN',
      assessment_status: 'STALE_DATA',
      timestamp,
      parameters_considered: [],
      parameters_outside_criteria: [],
      parameter_details: {},
      errors: ['Sensor readings are stale'],
      explanation: 'Sensor readings are STALE (timed out). Treatment recommendation cannot be determined safely.',
      recommendation: rec,
      stage_mapping: { stage_1: 'BYPASSED', stage_2: 'BYPASSED', stage_3: 'BYPASSED' },
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  if (!sensors || typeof sensors !== 'object') {
    const rec = buildRecommendation('UNKNOWN', {}, ['Missing sensor payload object.']);
    return {
      treatment_level: 'UNKNOWN',
      legacy_treatment_level: 'UNKNOWN',
      assessment_status: 'UNKNOWN',
      timestamp,
      parameters_considered: [],
      parameters_outside_criteria: [],
      parameter_details: {},
      errors: ['No sensor readings provided'],
      explanation: 'No sensor data available for assessment. Lowest treatment is NOT assumed.',
      recommendation: rec,
      stage_mapping: { stage_1: 'BYPASSED', stage_2: 'BYPASSED', stage_3: 'BYPASSED' },
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  const parametersConsidered = [];
  const parametersOutsideCriteria = [];
  const parameterDetails = {};
  const stageDemands = [];
  const sensorErrors = [];

  // Turbidity
  const turbMaxL1 = thresholds.turbidity_ntu.level_1_max ?? thresholds.turbidity_ntu.basic_max ?? 5.0;
  const turbMaxL2 = thresholds.turbidity_ntu.level_2_max ?? thresholds.turbidity_ntu.medium_max ?? 25.0;
  const turb = sensors.turbidity_ntu;

  if (turb === null || turb === undefined || !Number.isFinite(Number(turb)) || Number(turb) < 0) {
    sensorErrors.push(`Required Turbidity sensor reading is missing or invalid: ${turb}`);
  } else {
    const val = Number(turb);
    parametersConsidered.push('turbidity_ntu');
    if (val <= turbMaxL1) {
      parameterDetails.turbidity_ntu = {
        value: val,
        unit: 'NTU',
        status: 'LOW',
        satisfies_level: 'LEVEL_1',
        reason: `Turbidity is within Level 1 baseline (≤ ${turbMaxL1} NTU)`
      };
      stageDemands.push({ level: 'LEVEL_1', reason: parameterDetails.turbidity_ntu.reason });
    } else if (val <= turbMaxL2) {
      parameterDetails.turbidity_ntu = {
        value: val,
        unit: 'NTU',
        status: 'MODERATE',
        satisfies_level: 'LEVEL_2',
        reason: `Turbidity (${val.toFixed(1)} NTU) exceeds Level 1 limit (${turbMaxL1} NTU), requiring Level 2 filtration`
      };
      parametersOutsideCriteria.push('turbidity_ntu');
      stageDemands.push({ level: 'LEVEL_2', reason: parameterDetails.turbidity_ntu.reason });
    } else {
      parameterDetails.turbidity_ntu = {
        value: val,
        unit: 'NTU',
        status: 'HIGH',
        satisfies_level: 'LEVEL_3',
        reason: `Turbidity (${val.toFixed(1)} NTU) indicates heavy particulate contamination (exceeds ${turbMaxL2} NTU)`
      };
      parametersOutsideCriteria.push('turbidity_ntu');
      stageDemands.push({ level: 'LEVEL_3', reason: parameterDetails.turbidity_ntu.reason });
    }
  }

  // TDS
  const tdsMaxL1 = thresholds.tds_ppm.level_1_max ?? thresholds.tds_ppm.basic_max ?? 300.0;
  const tdsMaxL2 = thresholds.tds_ppm.level_2_max ?? thresholds.tds_ppm.medium_max ?? 800.0;
  const tds = sensors.tds_ppm;

  if (tds === null || tds === undefined || !Number.isFinite(Number(tds)) || Number(tds) < 0) {
    sensorErrors.push(`Required TDS sensor reading is missing or invalid: ${tds}`);
  } else {
    const val = Number(tds);
    parametersConsidered.push('tds_ppm');
    if (val <= tdsMaxL1) {
      parameterDetails.tds_ppm = {
        value: val,
        unit: 'ppm',
        status: 'LOW',
        satisfies_level: 'LEVEL_1',
        reason: `TDS is within Level 1 baseline (≤ ${tdsMaxL1} ppm)`
      };
      stageDemands.push({ level: 'LEVEL_1', reason: parameterDetails.tds_ppm.reason });
    } else if (val <= tdsMaxL2) {
      parameterDetails.tds_ppm = {
        value: val,
        unit: 'ppm',
        status: 'MODERATE',
        satisfies_level: 'LEVEL_2',
        reason: `TDS (${val.toFixed(0)} ppm) exceeds Level 1 limit (${tdsMaxL1} ppm), requiring activated carbon / adsorption`
      };
      parametersOutsideCriteria.push('tds_ppm');
      stageDemands.push({ level: 'LEVEL_2', reason: parameterDetails.tds_ppm.reason });
    } else {
      parameterDetails.tds_ppm = {
        value: val,
        unit: 'ppm',
        status: 'HIGH',
        satisfies_level: 'LEVEL_3',
        reason: `TDS (${val.toFixed(0)} ppm) indicates heavy dissolved load (exceeds ${tdsMaxL2} ppm)`
      };
      parametersOutsideCriteria.push('tds_ppm');
      stageDemands.push({ level: 'LEVEL_3', reason: parameterDetails.tds_ppm.reason });
    }
  }

  // Temperature (Contextual only - Non-dependent)
  const temp = sensors.temperature_c;
  if (temp === null || temp === undefined) {
    parameterDetails.temperature_c = {
      value: null,
      unit: '°C',
      status: 'UNAVAILABLE_DISCONNECTED',
      context: 'DS18B20 temperature probe reading unavailable or probe disconnected'
    };
  } else if (!Number.isFinite(Number(temp)) || Number(temp) < -10 || Number(temp) > 85) {
    // Non-dependent contextual metric: Flag as SENSOR_ANOMALY without aborting classification
    parameterDetails.temperature_c = {
      value: Number.isFinite(Number(temp)) ? Number(temp) : null,
      unit: '°C',
      status: 'SENSOR_ANOMALY',
      context: `Temperature reading (${temp}) is abnormal or out of range [-10°C to 85°C]; contextual metric bypassed without affecting water treatment classification.`
    };
  } else {
    const val = Number(temp);
    parametersConsidered.push('temperature_c');
    const isElevated = val > (thresholds.temperature_c.warning_max || 60.0);
    parameterDetails.temperature_c = {
      value: val,
      unit: '°C',
      status: isElevated ? 'ELEVATED_WARMTH' : 'NORMAL_RANGE',
      context: isElevated
        ? `Water temperature is elevated (${val.toFixed(1)}°C); thermal context recorded.`
        : `Temperature (${val.toFixed(1)}°C) is normal for domestic greywater.`
    };
  }

  // Optional pH
  const ph = sensors.ph;
  if (ph !== null && ph !== undefined) {
    if (!Number.isFinite(Number(ph)) || Number(ph) < 0 || Number(ph) > 14) {
      sensorErrors.push(`Optional pH reading is outside plausible 0-14 range: ${ph}`);
    } else {
      const val = Number(ph);
      parametersConsidered.push('ph');
      const phMin = thresholds.ph.basic_min || 6.5;
      const phMax = thresholds.ph.basic_max || 8.5;
      if (val >= phMin && val <= phMax) {
        parameterDetails.ph = {
          value: val,
          unit: 'pH',
          status: 'NORMAL',
          reason: `pH (${val.toFixed(1)}) is balanced [${phMin} - ${phMax}]`
        };
      } else {
        parameterDetails.ph = {
          value: val,
          unit: 'pH',
          status: 'OFFSET',
          reason: `pH (${val.toFixed(1)}) deviates from neutral range [${phMin} - ${phMax}]`
        };
        parametersOutsideCriteria.push('ph');
      }
    }
  } else {
    parameterDetails.ph = {
      value: null,
      unit: 'pH',
      status: 'OPTIONAL_UNINSTALLED',
      reason: 'pH sensor is optional and currently omitted from the physical hardware'
    };
  }

  if (sensorErrors.length > 0) {
    const rec = buildRecommendation('UNKNOWN', parameterDetails, sensorErrors);
    return {
      treatment_level: 'UNKNOWN',
      legacy_treatment_level: 'UNKNOWN',
      assessment_status: 'SENSOR_ERROR',
      timestamp,
      parameters_considered: parametersConsidered,
      parameters_outside_criteria: parametersOutsideCriteria,
      parameter_details: parameterDetails,
      errors: sensorErrors,
      explanation: `Assessment failed due to sensor errors: ${sensorErrors.join('; ')}. Lowest treatment is NOT assumed.`,
      recommendation: rec,
      stage_mapping: { stage_1: 'BYPASSED', stage_2: 'BYPASSED', stage_3: 'BYPASSED' },
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  let assignedLevel = 'LEVEL_1';
  if (stageDemands.some((d) => d.level === 'LEVEL_3')) {
    assignedLevel = 'LEVEL_3';
  } else if (stageDemands.some((d) => d.level === 'LEVEL_2')) {
    assignedLevel = 'LEVEL_2';
  }

  let assessmentStatus = 'NORMAL';
  if (assignedLevel === 'LEVEL_3') {
    assessmentStatus = 'HIGH_CONTAMINATION';
  } else if (assignedLevel === 'LEVEL_2') {
    assessmentStatus = 'MODERATE_CONTAMINATION';
  }

  const reasons = stageDemands.filter((d) => d.level === assignedLevel).map((d) => d.reason);
  if (reasons.length === 0 && assignedLevel === 'LEVEL_1') {
    reasons.push('All measured water quality parameters (TDS, Turbidity) meet Level 1 baseline thresholds.');
  }

  let explanation = '';
  if (assignedLevel === 'LEVEL_1') {
    explanation = 'Level 1 (Basic treatment) recommended: Turbidity and TDS satisfy basic baseline criteria. Simple physical screening/settling is suggested before non-potable reuse.';
  } else if (assignedLevel === 'LEVEL_2') {
    explanation = `Level 2 (Moderate treatment) recommended because: ${reasons.join('; ')}. Physical filtration combined with activated carbon adsorption is suggested.`;
  } else {
    explanation = `Level 3 (Advanced treatment) recommended because: ${reasons.join('; ')}. Multi-stage coagulation, fine membrane filtration, and carbon polishing are advised.`;
  }

  const recommendation = buildRecommendation(assignedLevel, parameterDetails, reasons);
  const legacyLevelMap = { LEVEL_1: 'BASIC', LEVEL_2: 'MEDIUM', LEVEL_3: 'HIGH', UNKNOWN: 'UNKNOWN' };
  const legacyLevel = legacyLevelMap[assignedLevel] || assignedLevel;

  return {
    treatment_level: assignedLevel,
    legacy_treatment_level: legacyLevel,
    assessment_status: assessmentStatus,
    timestamp,
    parameters_considered: parametersConsidered,
    parameters_outside_criteria: parametersOutsideCriteria,
    parameter_details: parameterDetails,
    reasons,
    explanation,
    recommendation,
    stage_mapping: {
      stage_1: assignedLevel !== 'UNKNOWN' ? 'ACTIVE' : 'BYPASSED',
      stage_2: (assignedLevel === 'LEVEL_2' || assignedLevel === 'LEVEL_3') ? 'ACTIVE' : 'BYPASSED',
      stage_3: assignedLevel === 'LEVEL_3' ? 'ACTIVE' : 'BYPASSED'
    },
    rules_version: config.version,
    safety_disclaimer: getSafetyDisclaimer()
  };
}
