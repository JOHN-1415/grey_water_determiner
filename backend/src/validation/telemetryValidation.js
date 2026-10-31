/**
 * Telemetry Validation Module for GreyWater Guardian
 *
 * Implements strict payload validation for IoT Greywater Quality Assessment:
 * - Checks types and required fields
 * - Validates finite numeric values
 * - Enforces plausible physical sensor ranges
 * - Treats pH as optional / uninstalled
 * - Treats temperature as nullable (DS18B20 disconnect)
 * - Flags sensor errors without fabricating values
 * - Excludes obsolete pump / filtration control fields
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

  // Handle optional or nullable sensors
  if (value === null || value === undefined) {
    if (config.optional) {
      return { valid: true, value: null, isMissingOptional: true };
    }
    return { valid: false, error: `Required sensor '${key}' is missing or null` };
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
 * Normalizes classification to standard LEVEL_1, LEVEL_2, LEVEL_3, UNKNOWN
 */
export function normalizeClassification(cls) {
  if (!cls) return null;
  const upper = String(cls).trim().toUpperCase();
  if (upper === 'BASIC' || upper === 'LEVEL_1' || upper === '1') return 'LEVEL_1';
  if (upper === 'MEDIUM' || upper === 'LEVEL_2' || upper === '2') return 'LEVEL_2';
  if (upper === 'HIGH' || upper === 'LEVEL_3' || upper === '3') return 'LEVEL_3';
  return 'UNKNOWN';
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
  const sensorValidityFlags = {};

  for (const [key, limit] of Object.entries(SENSOR_PLAUSIBILITY_LIMITS)) {
    const res = validateSensorValue(key, rawSensors[key], limit);
    if (!res.valid) {
      sensorValidationErrors.push(res.error);
      sensorValidityFlags[key] = false;
    } else {
      validatedSensors[key] = res.value;
      sensorValidityFlags[key] = res.value !== null;
    }
  }

  if (sensorValidationErrors.length > 0) {
    errors.push(...sensorValidationErrors);
  }

  const isValid = errors.length === 0;

  // Normalized classification from hardware or simulation if provided
  const rawClass = payload.classification || payload.recommended_treatment_level;
  const classification = normalizeClassification(rawClass);

  return {
    isValid,
    errors,
    data: isValid
      ? {
          device_id: payload.device_id.trim(),
          sequence: seq,
          uptime_seconds: Number.isFinite(uptime) ? uptime : 0,
          sensors: validatedSensors,
          sensor_validity: sensorValidityFlags,
          device_status: payload.device_status || 'ONLINE',
          classification,
          source_mode: payload.source_mode || 'HARDWARE'
        }
      : null
  };
}
