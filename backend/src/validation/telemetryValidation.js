/**
 * Telemetry Validation Module for GreyWater Guardian
 *
 * Implements strict payload validation:
 * - Checks types and required fields
 * - Validates finite numeric values
 * - Enforces plausible sensor ranges
 * - Treats pH as optional (nullable)
 * - Flags sensor errors without replacing values with zero
 */

export const SENSOR_PLAUSIBILITY_LIMITS = {
  ph: { min: 0.0, max: 14.0, unit: 'pH', optional: true },
  tds_ppm: { min: 0.0, max: 5000.0, unit: 'ppm', optional: false },
  turbidity_ntu: { min: 0.0, max: 2000.0, unit: 'NTU', optional: false },
  temperature_c: { min: 0.0, max: 80.0, unit: '°C', optional: false }
};

/**
 * Validates a single sensor value against numeric and plausibility limits
 */
export function validateSensorValue(key, value, config = SENSOR_PLAUSIBILITY_LIMITS[key]) {
  if (!config) {
    return { valid: true, value };
  }

  // Handle optional sensors (like pH)
  if (value === null || value === undefined) {
    if (config.optional) {
      return { valid: true, value: null, isMissingOptional: true };
    }
    return { valid: false, error: `Required sensor '${key}' is missing` };
  }

  // Must be a number or valid numeric string
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return { valid: false, error: `Sensor '${key}' must be a finite number, received: ${value}` };
  }

  // Plausibility range check
  if (num < config.min || num > config.max) {
    return {
      valid: false,
      error: `Sensor '${key}' value ${num} ${config.unit} is outside plausible range [${config.min}, ${config.max}]`
    };
  }

  return { valid: true, value: num };
}

/**
 * Validates the full telemetry payload from ESP32 or simulation provider
 * @param {object} payload
 * @returns {{ isValid: boolean, errors: string[], data: object | null }}
 */
export function validateTelemetryPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be a non-empty JSON object'], data: null };
  }

  // device_id validation
  if (!payload.device_id || typeof payload.device_id !== 'string' || payload.device_id.trim().length === 0) {
    errors.push("Missing or invalid 'device_id' string");
  }

  // sequence validation
  const seq = Number(payload.sequence);
  if (payload.sequence === undefined || payload.sequence === null || !Number.isInteger(seq) || seq < 0) {
    errors.push("Missing or invalid 'sequence' (must be a non-negative integer)");
  }

  // uptime_seconds validation
  const uptime = Number(payload.uptime_seconds);
  if (payload.uptime_seconds !== undefined && (!Number.isFinite(uptime) || uptime < 0)) {
    errors.push("'uptime_seconds' must be a non-negative number");
  }

  // sensors object validation
  if (!payload.sensors || typeof payload.sensors !== 'object') {
    errors.push("Missing or invalid 'sensors' object");
    return { isValid: false, errors, data: null };
  }

  const validatedSensors = {};
  const sensorValidationErrors = [];

  for (const [key, limit] of Object.entries(SENSOR_PLAUSIBILITY_LIMITS)) {
    const res = validateSensorValue(key, payload.sensors[key], limit);
    if (!res.valid) {
      sensorValidationErrors.push(res.error);
    } else {
      validatedSensors[key] = res.value;
    }
  }

  if (sensorValidationErrors.length > 0) {
    errors.push(...sensorValidationErrors);
  }

  // Optional output_sensors validation (post-treatment verification)
  let validatedOutputSensors = null;
  if (payload.output_sensors && typeof payload.output_sensors === 'object') {
    validatedOutputSensors = {};
    for (const [key, limit] of Object.entries(SENSOR_PLAUSIBILITY_LIMITS)) {
      if (payload.output_sensors[key] !== undefined) {
        const res = validateSensorValue(key, payload.output_sensors[key], limit);
        if (!res.valid) {
          errors.push(`Output ${res.error}`);
        } else {
          validatedOutputSensors[key] = res.value;
        }
      }
    }
  }

  // Treatment state validation
  let validatedTreatment = null;
  if (payload.treatment && typeof payload.treatment === 'object') {
    const activeStage = payload.treatment.active_stage;
    validatedTreatment = {
      active_stage: (activeStage === null || activeStage === undefined) ? null : Number(activeStage),
      stage_1: payload.treatment.stage_1 || 'UNKNOWN',
      stage_2: payload.treatment.stage_2 || 'UNKNOWN',
      stage_3: payload.treatment.stage_3 || 'UNKNOWN',
      pump_status: payload.treatment.pump_status || 'UNKNOWN'
    };
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          device_id: payload.device_id.trim(),
          sequence: seq,
          uptime_seconds: Number.isFinite(uptime) ? uptime : 0,
          sensors: validatedSensors,
          device_status: payload.device_status || 'ONLINE',
          treatment: validatedTreatment,
          output_sensors: validatedOutputSensors,
          source_mode: payload.source_mode || 'HARDWARE'
        }
      : null
  };
}
