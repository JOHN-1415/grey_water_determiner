/**
 * GreyWater Guardian - Adaptive Water Quality Rules Engine
 *
 * Deterministic, configurable rules engine for classifying domestic greywater
 * into required treatment levels: BASIC, MEDIUM, HIGH, or UNKNOWN.
 *
 * Designed to operate with or without an optional pH sensor.
 */

export const DEFAULT_RULES_CONFIG = {
  version: '1.0.0-prototype',
  description: 'Prototype non-potable domestic greywater filtration rules',
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
      basic_max: 300,
      medium_max: 800
    },
    turbidity_ntu: {
      optional: false,
      basic_max: 5.0,
      medium_max: 25.0
    },
    temperature_c: {
      optional: false,
      nominal_min: 10.0,
      nominal_max: 45.0,
      warning_max: 60.0
    }
  },
  stage_architecture: {
    BASIC: {
      stage_1: 'ACTIVE',
      stage_2: 'BYPASSED',
      stage_3: 'BYPASSED',
      description: 'Physical sediment / mesh pre-filtration only'
    },
    MEDIUM: {
      stage_1: 'ACTIVE',
      stage_2: 'ACTIVE',
      stage_3: 'BYPASSED',
      description: 'Physical filtration + Activated carbon adsorption'
    },
    HIGH: {
      stage_1: 'ACTIVE',
      stage_2: 'ACTIVE',
      stage_3: 'ACTIVE',
      description: 'Physical filtration + Activated carbon + Fine/Microfiltration module'
    },
    UNKNOWN: {
      stage_1: 'BYPASSED',
      stage_2: 'BYPASSED',
      stage_3: 'BYPASSED',
      description: 'System in safe hold; awaiting valid sensor telemetry'
    }
  }
};

/**
 * Assesses greywater quality and calculates treatment recommendation.
 *
 * @param {object} sensors - Sensor readings { ph, tds_ppm, turbidity_ntu, temperature_c }
 * @param {object} [customConfig] - Optional rules configuration override
 * @param {object} [metadata] - Optional context (stale flag, device_status, etc.)
 * @returns {object} Full assessment result
 */
export function assessWaterQuality(sensors, customConfig = null, metadata = {}) {
  const config = customConfig || DEFAULT_RULES_CONFIG;
  const thresholds = config.thresholds;
  const timestamp = new Date().toISOString();

  // If metadata indicates device offline or stale, handle accordingly
  if (metadata.is_offline) {
    return {
      treatment_level: 'UNKNOWN',
      assessment_status: 'OFFLINE',
      timestamp,
      parameters_considered: [],
      parameters_outside_criteria: [],
      parameter_details: {},
      explanation: 'Device is OFFLINE. Cannot perform water quality assessment.',
      stage_mapping: config.stage_architecture.UNKNOWN,
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  if (metadata.is_stale) {
    return {
      treatment_level: 'UNKNOWN',
      assessment_status: 'STALE_DATA',
      timestamp,
      parameters_considered: [],
      parameters_outside_criteria: [],
      parameter_details: {},
      explanation: 'Sensor readings are STALE (timed out). Treatment cannot be determined.',
      stage_mapping: config.stage_architecture.UNKNOWN,
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  // Validate sensors object
  if (!sensors || typeof sensors !== 'object') {
    return {
      treatment_level: 'UNKNOWN',
      assessment_status: 'UNKNOWN',
      timestamp,
      parameters_considered: [],
      parameters_outside_criteria: [],
      parameter_details: {},
      explanation: 'No sensor data available for assessment.',
      stage_mapping: config.stage_architecture.UNKNOWN,
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  const parametersConsidered = [];
  const parametersOutsideCriteria = [];
  const parameterDetails = {};
  const stageDemands = []; // Array of { level: 'BASIC' | 'MEDIUM' | 'HIGH', reason: string }
  const sensorErrors = [];

  // 1. Turbidity Assessment (NTU) - Required
  const turb = sensors.turbidity_ntu;
  if (turb === null || turb === undefined || !Number.isFinite(Number(turb)) || Number(turb) < 0) {
    sensorErrors.push(`Required Turbidity sensor reading is missing or invalid: ${turb}`);
  } else {
    const val = Number(turb);
    parametersConsidered.push('turbidity_ntu');
    if (val <= thresholds.turbidity_ntu.basic_max) {
      parameterDetails.turbidity_ntu = {
        value: val,
        unit: 'NTU',
        status: 'LOW',
        required_level: 'BASIC',
        reason: `Turbidity is within basic threshold (≤ ${thresholds.turbidity_ntu.basic_max} NTU)`
      };
      stageDemands.push({ level: 'BASIC', reason: parameterDetails.turbidity_ntu.reason });
    } else if (val <= thresholds.turbidity_ntu.medium_max) {
      parameterDetails.turbidity_ntu = {
        value: val,
        unit: 'NTU',
        status: 'MODERATE',
        required_level: 'MEDIUM',
        reason: `Turbidity (${val.toFixed(1)} NTU) exceeds basic threshold (${thresholds.turbidity_ntu.basic_max} NTU)`
      };
      parametersOutsideCriteria.push('turbidity_ntu');
      stageDemands.push({ level: 'MEDIUM', reason: parameterDetails.turbidity_ntu.reason });
    } else {
      parameterDetails.turbidity_ntu = {
        value: val,
        unit: 'NTU',
        status: 'HIGH',
        required_level: 'HIGH',
        reason: `Turbidity (${val.toFixed(1)} NTU) indicates heavy particulates (exceeds ${thresholds.turbidity_ntu.medium_max} NTU)`
      };
      parametersOutsideCriteria.push('turbidity_ntu');
      stageDemands.push({ level: 'HIGH', reason: parameterDetails.turbidity_ntu.reason });
    }
  }

  // 2. TDS Assessment (ppm) - Required
  const tds = sensors.tds_ppm;
  if (tds === null || tds === undefined || !Number.isFinite(Number(tds)) || Number(tds) < 0) {
    sensorErrors.push(`Required TDS sensor reading is missing or invalid: ${tds}`);
  } else {
    const val = Number(tds);
    parametersConsidered.push('tds_ppm');
    if (val <= thresholds.tds_ppm.basic_max) {
      parameterDetails.tds_ppm = {
        value: val,
        unit: 'ppm',
        status: 'LOW',
        required_level: 'BASIC',
        reason: `TDS is within basic threshold (≤ ${thresholds.tds_ppm.basic_max} ppm)`
      };
      stageDemands.push({ level: 'BASIC', reason: parameterDetails.tds_ppm.reason });
    } else if (val <= thresholds.tds_ppm.medium_max) {
      parameterDetails.tds_ppm = {
        value: val,
        unit: 'ppm',
        status: 'MODERATE',
        required_level: 'MEDIUM',
        reason: `TDS (${val.toFixed(0)} ppm) exceeds basic threshold (${thresholds.tds_ppm.basic_max} ppm), activated carbon recommended`
      };
      parametersOutsideCriteria.push('tds_ppm');
      stageDemands.push({ level: 'MEDIUM', reason: parameterDetails.tds_ppm.reason });
    } else {
      parameterDetails.tds_ppm = {
        value: val,
        unit: 'ppm',
        status: 'HIGH',
        required_level: 'HIGH',
        reason: `TDS (${val.toFixed(0)} ppm) is high (exceeds ${thresholds.tds_ppm.medium_max} ppm), requiring multi-stage fine filtration`
      };
      parametersOutsideCriteria.push('tds_ppm');
      stageDemands.push({ level: 'HIGH', reason: parameterDetails.tds_ppm.reason });
    }
  }

  // 3. Temperature Assessment (°C) - (DS18B20 Digital Sensor)
  const temp = sensors.temperature_c;
  if (temp === null || temp === undefined) {
    parameterDetails.temperature_c = {
      value: null,
      unit: '°C',
      status: 'UNAVAILABLE_DISCONNECTED',
      required_level: 'BASIC',
      reason: 'DS18B20 temperature probe reading unavailable or probe disconnected'
    };
  } else if (!Number.isFinite(Number(temp)) || Number(temp) < -10 || Number(temp) > 85) {
    sensorErrors.push(`Temperature sensor reading is implausible: ${temp}`);
  } else {
    const val = Number(temp);
    parametersConsidered.push('temperature_c');
    if (val > thresholds.temperature_c.warning_max) {
      parameterDetails.temperature_c = {
        value: val,
        unit: '°C',
        status: 'WARNING_HIGH',
        required_level: 'HIGH',
        reason: `Elevated temperature (${val.toFixed(1)}°C) exceeds safe nominal greywater range (max ${thresholds.temperature_c.warning_max}°C)`
      };
      parametersOutsideCriteria.push('temperature_c');
      stageDemands.push({ level: 'HIGH', reason: parameterDetails.temperature_c.reason });
    } else {
      parameterDetails.temperature_c = {
        value: val,
        unit: '°C',
        status: 'NORMAL',
        required_level: 'BASIC',
        reason: `Temperature (${val.toFixed(1)}°C) is within normal domestic greywater operating limits`
      };
      stageDemands.push({ level: 'BASIC', reason: parameterDetails.temperature_c.reason });
    }
  }

  // 4. pH Assessment (Optional)
  const ph = sensors.ph;
  if (ph !== null && ph !== undefined) {
    if (!Number.isFinite(Number(ph)) || Number(ph) < 0 || Number(ph) > 14) {
      sensorErrors.push(`Provided optional pH reading is implausible: ${ph}`);
    } else {
      const val = Number(ph);
      parametersConsidered.push('ph');
      if (val >= thresholds.ph.basic_min && val <= thresholds.ph.basic_max) {
        parameterDetails.ph = {
          value: val,
          unit: 'pH',
          status: 'NORMAL',
          required_level: 'BASIC',
          reason: `pH (${val.toFixed(1)}) is well balanced [${thresholds.ph.basic_min} - ${thresholds.ph.basic_max}]`
        };
        stageDemands.push({ level: 'BASIC', reason: parameterDetails.ph.reason });
      } else if (val >= thresholds.ph.medium_min && val <= thresholds.ph.medium_max) {
        parameterDetails.ph = {
          value: val,
          unit: 'pH',
          status: 'MODERATE_OFFSET',
          required_level: 'MEDIUM',
          reason: `pH (${val.toFixed(1)}) is mildly outside basic range [${thresholds.ph.basic_min} - ${thresholds.ph.basic_max}]`
        };
        parametersOutsideCriteria.push('ph');
        stageDemands.push({ level: 'MEDIUM', reason: parameterDetails.ph.reason });
      } else {
        parameterDetails.ph = {
          value: val,
          unit: 'pH',
          status: 'HIGH_OFFSET',
          required_level: 'HIGH',
          reason: `pH (${val.toFixed(1)}) deviates significantly (< ${thresholds.ph.medium_min} or > ${thresholds.ph.medium_max}), indicating detergent or acidic surge`
        };
        parametersOutsideCriteria.push('ph');
        stageDemands.push({ level: 'HIGH', reason: parameterDetails.ph.reason });
      }
    }
  } else {
    parameterDetails.ph = {
      value: null,
      unit: 'pH',
      status: 'OPTIONAL_UNINSTALLED',
      required_level: 'BASIC',
      reason: 'pH sensor is optional and currently omitted from the hardware pipeline'
    };
  }

  // If there are sensor errors for required sensors or implausible readings
  if (sensorErrors.length > 0) {
    return {
      treatment_level: 'UNKNOWN',
      assessment_status: 'SENSOR_ERROR',
      timestamp,
      parameters_considered: parametersConsidered,
      parameters_outside_criteria: parametersOutsideCriteria,
      parameter_details: parameterDetails,
      errors: sensorErrors,
      explanation: `Assessment failed due to sensor errors: ${sensorErrors.join('; ')}. Lowest treatment is NOT assumed.`,
      stage_mapping: config.stage_architecture.UNKNOWN,
      rules_version: config.version,
      safety_disclaimer: getSafetyDisclaimer()
    };
  }

  // Determine highest required treatment level (HIGH > MEDIUM > BASIC)
  let treatmentLevel = 'BASIC';
  if (stageDemands.some((d) => d.level === 'HIGH')) {
    treatmentLevel = 'HIGH';
  } else if (stageDemands.some((d) => d.level === 'MEDIUM')) {
    treatmentLevel = 'MEDIUM';
  }

  let assessmentStatus = 'NORMAL';
  if (treatmentLevel === 'HIGH') {
    assessmentStatus = 'HIGH_CONTAMINATION';
  } else if (treatmentLevel === 'MEDIUM') {
    assessmentStatus = 'MODERATE_CONTAMINATION';
  }

  // Generate clear human-readable explanation
  let explanation = '';
  if (treatmentLevel === 'BASIC') {
    explanation = 'Basic treatment (Stage 1 physical sediment filtration) is sufficient: all measured water quality parameters satisfy basic criteria.';
    if (sensors.ph === null || sensors.ph === undefined) {
      explanation += ' (Note: pH sensor is currently uninstalled / optional).';
    }
  } else if (treatmentLevel === 'MEDIUM') {
    const reasons = stageDemands.filter((d) => d.level === 'MEDIUM').map((d) => d.reason);
    explanation = `Medium treatment (Stages 1 & 2: sediment + activated carbon) is recommended because: ${reasons.join('; ')}.`;
  } else {
    const reasons = stageDemands.filter((d) => d.level === 'HIGH').map((d) => d.reason);
    explanation = `High treatment (Stages 1, 2 & 3: sediment + carbon + fine filtration) is recommended because: ${reasons.join('; ')}.`;
  }

  return {
    treatment_level: treatmentLevel,
    assessment_status: assessmentStatus,
    timestamp,
    parameters_considered: parametersConsidered,
    parameters_outside_criteria: parametersOutsideCriteria,
    parameter_details: parameterDetails,
    reasons: stageDemands.filter((d) => d.level === treatmentLevel).map((d) => d.reason),
    explanation,
    stage_mapping: config.stage_architecture[treatmentLevel] || config.stage_architecture.UNKNOWN,
    rules_version: config.version,
    safety_disclaimer: getSafetyDisclaimer()
  };
}

export function getSafetyDisclaimer() {
  return 'ENVIRONMENTAL & SAFETY NOTICE: Water classified by this system is intended strictly for controlled non-potable reuse (such as toilet flushing, landscape irrigation, and cleaning). This system does NOT evaluate microbiological safety or drinking water potability.';
}
