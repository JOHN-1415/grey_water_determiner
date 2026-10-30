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
  temperature_c: { min: -10.0, max: 85.0, unit: '°C', optional: true }
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

  // Extract sensors from either nested payload.sensors or flat root fields
  let rawSensors = payload.sensors;
  if (!rawSensors || typeof rawSensors !== 'object') {
    if (payload.tds_ppm !== undefined || payload.turbidity_ntu !== undefined || payload.temperature_c !== undefined) {
      rawSensors = {
        ph: payload.ph !== undefined ? payload.ph : null,
        tds_ppm: payload.tds_ppm,
        turbidity_ntu: payload.turbidity_ntu,
        temperature_c: payload.temperature_c !== undefined ? payload.temperature_c : null
      };
    } else {
      errors.push("Missing or invalid 'sensors' object (or sensor measurements)");
      return { isValid: false, errors, data: null };
    }
  }

  const validatedSensors = {};
  const sensorValidationErrors = [];

  for (const [key, limit] of Object.entries(SENSOR_PLAUSIBILITY_LIMITS)) {
    const res = validateSensorValue(key, rawSensors[key], limit);
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

  // Treatment state validation (Prototype has only Stage 1 physical filtration)
  const pumpStatus = payload.pump_status || payload.treatment?.pump_status || 'UNKNOWN';
  const activeStage = payload.treatment?.active_stage !== undefined
    ? payload.treatment.active_stage
    : (pumpStatus === 'ON' ? 1 : 0);

  const validatedTreatment = {
    active_stage: (activeStage === null || activeStage === undefined) ? null : Number(activeStage),
    stage_1: payload.treatment?.stage_1 || (pumpStatus === 'ON' ? 'ACTIVE' : 'IDLE'),
    stage_2: 'NOT_INSTALLED', // Physical prototype does not implement Stage 2
    stage_3: 'NOT_INSTALLED', // Physical prototype does not implement Stage 3
    pump_status: pumpStatus
  };

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
          classification: payload.classification || null,
          source_mode: payload.source_mode || 'HARDWARE'
        }
      : null
  };
}
