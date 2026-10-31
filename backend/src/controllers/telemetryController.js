/**
 * Telemetry and Device API Controller for GreyWater Guardian
 * IoT Greywater Quality Assessment & Recommendation System
 */

import { validateTelemetryPayload } from '../validation/telemetryValidation.js';
import { assessWaterQuality, DEFAULT_RULES_CONFIG } from '../services/rulesEngine.js';
import * as db from '../database/db.js';

// Cache in-memory last sequence per device for sequence integrity check
const lastSequences = new Map();

// Runtime rules configuration (allows configurable thresholds without restart)
let activeRulesConfig = { ...DEFAULT_RULES_CONFIG };

export function getActiveRulesConfig() {
  return activeRulesConfig;
}

export function setActiveRulesConfig(newConfig) {
  activeRulesConfig = { ...DEFAULT_RULES_CONFIG, ...newConfig, version: newConfig.version || '2.1.0-custom' };
  return activeRulesConfig;
}

/**
 * POST /api/v1/telemetry
 */
export async function postTelemetry(req, res) {
  try {
    const rawPayload = req.body;

    // 1. Validate payload
    const validation = validateTelemetryPayload(rawPayload);
    if (!validation.isValid) {
      await db.logEvent(
        rawPayload?.device_id || 'UNKNOWN',
        'VALIDATION_ERROR',
        `Telemetry rejected: ${validation.errors.join('; ')}`,
        'WARNING'
      );
      return res.status(400).json({
        status: 'ERROR',
        error: 'INVALID_PAYLOAD',
        details: validation.errors
      });
    }

    const data = validation.data;
    const deviceId = data.device_id;
    const receivedAt = new Date();

    // 2. Duplicate detection & Sequence integrity check
    // When ESP32 transmits concurrently over USB Serial and Wi-Fi, identical sequence packets arrive.
    const lastSeq = lastSequences.get(deviceId);
    if (lastSeq !== undefined && data.sequence === lastSeq) {
      // Suppress duplicate record persistence
      return res.status(200).json({
        status: 'SUCCESS',
        message: 'Duplicate telemetry sequence suppressed (dual-channel Wi-Fi/Serial ingestion)',
        device_id: deviceId,
        sequence: data.sequence,
        is_duplicate: true
      });
    }

    let sequenceWarning = null;
    if (lastSeq !== undefined) {
      if (data.sequence < lastSeq) {
        sequenceWarning = `Out-of-order sequence: received ${data.sequence}, last was ${lastSeq}`;
        await db.logEvent(deviceId, 'SEQUENCE_ANOMALY', sequenceWarning, 'WARNING');
      } else if (data.sequence > lastSeq + 1) {
        const missing = data.sequence - lastSeq - 1;
        await db.logEvent(deviceId, 'PACKET_LOSS', `${missing} telemetry packets missed between seq ${lastSeq} and ${data.sequence}`, 'INFO');
      }
    }
    lastSequences.set(deviceId, data.sequence);

    // 3. Assess Water Quality & Generate Recommendations
    const isStale = data.is_stale_simulation || false;
    const isOffline = data.device_status === 'OFFLINE' || data.is_offline_simulation;
    const assessment = assessWaterQuality(data.sensors, activeRulesConfig, {
      is_stale: isStale,
      is_offline: isOffline
    });

    // 4. Backend-Authoritative Classification Check
    // The backend analysis engine is authoritative over preliminary ESP32 local estimates
    const authoritativeLevel = assessment.treatment_level;
    if (data.classification && data.classification !== authoritativeLevel && authoritativeLevel !== 'UNKNOWN') {
      await db.logEvent(
        deviceId,
        'CLASSIFICATION_OVERRIDE',
        `Backend rules evaluated ${authoritativeLevel} (ESP32 local estimate was ${data.classification})`,
        'INFO'
      );
    }

    // 5. Persist to Database / Memory store
    const recordToSave = {
      device_id: deviceId,
      sequence: data.sequence,
      uptime_seconds: data.uptime_seconds,
      received_at: isStale
        ? new Date(Date.now() - (rawPayload.stale_offset_seconds || 60) * 1000).toISOString()
        : receivedAt.toISOString(),
      sensors: data.sensors,
      sensor_validity: data.sensor_validity,
      device_status: data.device_status,
      source_mode: data.source_mode,
      classification: authoritativeLevel, // Backend-authoritative classification
      raw_esp32_classification: data.classification || null,
      assessment,
      raw_payload: rawPayload
    };

    const saved = await db.saveReading(recordToSave);

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Telemetry evaluated and saved',
      received_at: recordToSave.received_at,
      device_id: deviceId,
      sequence: data.sequence,
      sequence_warning: sequenceWarning,
      source_mode: data.source_mode,
      assessment: {
        treatment_level: assessment.treatment_level,
        legacy_treatment_level: assessment.legacy_treatment_level,
        assessment_status: assessment.assessment_status,
        explanation: assessment.explanation,
        reasons: assessment.reasons,
        parameters_considered: assessment.parameters_considered,
        parameters_outside_criteria: assessment.parameters_outside_criteria,
        recommendation: assessment.recommendation,
        stage_mapping: assessment.stage_mapping
      },
      reading_id: saved.id
    });
  } catch (err) {
    console.error('[TelemetryController] Error:', err);
    return res.status(500).json({
      status: 'ERROR',
      error: 'INTERNAL_SERVER_ERROR',
      message: err.message
    });
  }
}

/**
 * GET /api/v1/devices/:deviceId/latest
 */
export async function getLatest(req, res) {
  try {
    const { deviceId } = req.params;
    const reading = await db.getLatestReading(deviceId);

    if (!reading) {
      return res.status(404).json({
        status: 'NOT_FOUND',
        error: `No telemetry found for device '${deviceId}'`
      });
    }

    const sensors = {
      ph: reading.ph,
      tds_ppm: reading.tds_ppm,
      turbidity_ntu: reading.turbidity_ntu,
      temperature_c: reading.temperature_c
    };

    // Calculate stale status (threshold: 30 seconds)
    const readingAgeSeconds = Math.max(0, Math.floor((Date.now() - new Date(reading.received_at).getTime()) / 1000));
    const isStale = readingAgeSeconds > 30 && reading.source_mode === 'HARDWARE';

    const assessment = assessWaterQuality(sensors, activeRulesConfig, {
      is_stale: isStale,
      is_offline: reading.device_status === 'OFFLINE'
    });

    return res.json({
      status: 'SUCCESS',
      data: {
        ...reading,
        sensors,
        reading_age_seconds: readingAgeSeconds,
        is_stale: isStale,
        assessment
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
}

/**
 * GET /api/v1/devices/:deviceId/history?limit=100
 */
export async function getHistory(req, res) {
  try {
    const { deviceId } = req.params;
    const limit = req.query.limit || 100;
    const history = await db.getReadingHistory(deviceId, limit);
    return res.json({
      status: 'SUCCESS',
      device_id: deviceId,
      count: history.length,
      data: history
    });
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
}

/**
 * GET /api/v1/devices/:deviceId/status
 */
export async function getStatus(req, res) {
  try {
    const { deviceId } = req.params;
    const status = await db.getDeviceStatus(deviceId, 30);
    return res.json({
      status: 'SUCCESS',
      data: status
    });
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
}

/**
 * GET /api/v1/devices/:deviceId/events
 */
export async function getEvents(req, res) {
  try {
    const { deviceId } = req.params;
    const limit = req.query.limit || 50;
    const events = await db.getSystemEvents(deviceId, limit);
    return res.json({
      status: 'SUCCESS',
      device_id: deviceId,
      data: events
    });
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
}
