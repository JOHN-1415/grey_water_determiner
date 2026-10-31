/**
 * Database Layer for GreyWater Guardian
 * IoT Greywater Quality Assessment & Recommendation System
 *
 * Supports MySQL connection pooling via mysql2.
 * Includes an integrated resilient in-memory fallback store if MySQL is
 * unreachable during demo mode or initial development.
 */

import mysql from 'mysql2/promise';

let pool = null;
let isUsingFallback = false;

// Resilient In-Memory store for demo mode & offline development
const inMemoryStore = {
  devices: new Map([
    ['GW-001', { device_id: 'GW-001', device_name: 'ESP32 Greywater Quality Monitor', last_seen_at: new Date().toISOString() }]
  ]),
  readings: [],
  events: []
};

/**
 * Initialize Database Connection
 */
export async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'greywater_guardian';
  const port = Number(process.env.DB_PORT) || 3306;

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    isUsingFallback = false;
    console.log(`[DB] Successfully connected to MySQL database '${database}' on ${host}:${port}`);
  } catch (err) {
    isUsingFallback = true;
    console.warn(`[DB] MySQL connection notice: (${err.message}).`);
    console.warn(`[DB] Activating local high-speed persistent in-memory repository for demo mode & seamless testing.`);
    console.warn(`[DB] To use persistent MySQL, import 'database/schema.sql' and configure credentials in '.env'.`);
  }
}

/**
 * Check if running in MySQL or memory fallback mode
 */
export function getDbMode() {
  return isUsingFallback ? 'IN_MEMORY_FALLBACK' : 'MYSQL';
}

/**
 * Register or update device
 */
export async function upsertDevice(deviceId, deviceName = 'ESP32 Greywater Monitor') {
  const now = new Date();
  if (isUsingFallback || !pool) {
    const existing = inMemoryStore.devices.get(deviceId) || { device_id: deviceId, created_at: now.toISOString() };
    existing.device_name = deviceName;
    existing.last_seen_at = now.toISOString();
    inMemoryStore.devices.set(deviceId, existing);
    return existing;
  }

  try {
    const query = `
      INSERT INTO devices (device_id, device_name, last_seen_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE device_name = VALUES(device_name), last_seen_at = VALUES(last_seen_at)
    `;
    await pool.execute(query, [deviceId, deviceName, now]);
  } catch (err) {
    console.error('[DB] upsertDevice error:', err.message);
  }
}

/**
 * Save new sensor reading & water quality assessment
 */
export async function saveReading(reading) {
  const receivedAt = reading.received_at ? new Date(reading.received_at) : new Date();
  const assignedClassification = reading.assessment?.treatment_level || reading.classification || 'UNKNOWN';

  if (isUsingFallback || !pool) {
    // De-duplication check: if this sequence was already stored for this device, return existing record
    if (reading.sequence !== undefined && reading.sequence !== null) {
      const existing = inMemoryStore.readings.find(
        (r) => r.device_id === reading.device_id && r.sequence === reading.sequence
      );
      if (existing) {
        return existing;
      }
    }

    const record = {
      id: inMemoryStore.readings.length + 1,
      device_id: reading.device_id,
      received_at: receivedAt.toISOString(),
      sequence: reading.sequence,
      tds_ppm: reading.sensors?.tds_ppm ?? null,
      turbidity_ntu: reading.sensors?.turbidity_ntu ?? null,
      temperature_c: reading.sensors?.temperature_c ?? null,
      ph: reading.sensors?.ph ?? null,
      sensor_validity: reading.sensor_validity || {
        tds_ppm: reading.sensors?.tds_ppm !== null && reading.sensors?.tds_ppm !== undefined,
        turbidity_ntu: reading.sensors?.turbidity_ntu !== null && reading.sensors?.turbidity_ntu !== undefined,
        temperature_c: reading.sensors?.temperature_c !== null && reading.sensors?.temperature_c !== undefined,
        ph: reading.sensors?.ph !== null && reading.sensors?.ph !== undefined
      },
      assigned_classification: assignedClassification,
      recommended_treatment_level: assignedClassification, // backwards compatibility
      assessment_status: reading.assessment?.assessment_status || 'UNKNOWN',
      recommendation_details: reading.assessment?.recommendation || null,
      device_status: reading.device_status || 'ONLINE',
      source_mode: reading.source_mode || 'HARDWARE',
      raw_payload: reading.raw_payload || reading
    };
    inMemoryStore.readings.push(record);
    if (inMemoryStore.readings.length > 500) {
      inMemoryStore.readings.shift();
    }
    upsertDevice(reading.device_id);
    return record;
  }

  try {
    await upsertDevice(reading.device_id);

    const query = `
      INSERT INTO sensor_readings (
        device_id, received_at, sequence, tds_ppm, turbidity_ntu, temperature_c, ph,
        sensor_validity, assigned_classification, recommended_treatment_level,
        assessment_status, recommendation_details, device_status, source_mode, raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const validity = reading.sensor_validity || {
      tds_ppm: reading.sensors?.tds_ppm !== null && reading.sensors?.tds_ppm !== undefined,
      turbidity_ntu: reading.sensors?.turbidity_ntu !== null && reading.sensors?.turbidity_ntu !== undefined,
      temperature_c: reading.sensors?.temperature_c !== null && reading.sensors?.temperature_c !== undefined,
      ph: reading.sensors?.ph !== null && reading.sensors?.ph !== undefined
    };

    const values = [
      reading.device_id,
      receivedAt,
      reading.sequence,
      reading.sensors?.tds_ppm ?? null,
      reading.sensors?.turbidity_ntu ?? null,
      reading.sensors?.temperature_c ?? null,
      reading.sensors?.ph ?? null,
      JSON.stringify(validity),
      assignedClassification,
      assignedClassification,
      reading.assessment?.assessment_status || 'UNKNOWN',
      JSON.stringify(reading.assessment?.recommendation || null),
      reading.device_status || 'ONLINE',
      reading.source_mode || 'HARDWARE',
      JSON.stringify(reading.raw_payload || reading)
    ];

    const [result] = await pool.execute(query, values);
    return { id: result.insertId, ...reading, received_at: receivedAt.toISOString() };
  } catch (err) {
    console.error('[DB] saveReading error:', err.message);
    throw err;
  }
}

/**
 * Fetch latest reading for device
 */
export async function getLatestReading(deviceId) {
  if (isUsingFallback || !pool) {
    const list = inMemoryStore.readings.filter((r) => r.device_id === deviceId);
    return list.length > 0 ? list[list.length - 1] : null;
  }

  try {
    const query = `
      SELECT * FROM sensor_readings
      WHERE device_id = ?
      ORDER BY received_at DESC, id DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [deviceId]);
    if (rows.length === 0) return null;
    return rows[0];
  } catch (err) {
    console.error('[DB] getLatestReading error:', err.message);
    throw err;
  }
}

/**
 * Fetch reading history for charts and analytics
 */
export async function getReadingHistory(deviceId, limit = 100) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 500);

  if (isUsingFallback || !pool) {
    const list = inMemoryStore.readings.filter((r) => r.device_id === deviceId);
    return list.slice(-safeLimit).reverse();
  }

  try {
    const query = `
      SELECT * FROM sensor_readings
      WHERE device_id = ?
      ORDER BY received_at DESC, id DESC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [deviceId, safeLimit]);
    return rows;
  } catch (err) {
    console.error('[DB] getReadingHistory error:', err.message);
    throw err;
  }
}

/**
 * Log a system event
 */
export async function logEvent(deviceId, eventType, message, severity = 'INFO') {
  const now = new Date();
  const event = {
    id: inMemoryStore.events.length + 1,
    device_id: deviceId,
    event_type: eventType,
    message,
    severity,
    created_at: now.toISOString()
  };

  if (isUsingFallback || !pool) {
    inMemoryStore.events.push(event);
    if (inMemoryStore.events.length > 200) {
      inMemoryStore.events.shift();
    }
    return event;
  }

  try {
    const query = `
      INSERT INTO system_events (device_id, event_type, message, severity, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [res] = await pool.execute(query, [deviceId, eventType, message, severity, now]);
    return { ...event, id: res.insertId };
  } catch (err) {
    console.error('[DB] logEvent error:', err.message);
    return event;
  }
}

/**
 * Fetch recent system events
 */
export async function getSystemEvents(deviceId, limit = 50) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);

  if (isUsingFallback || !pool) {
    const evs = inMemoryStore.events.filter((e) => e.device_id === deviceId);
    return evs.slice(-safeLimit).reverse();
  }

  try {
    const query = `
      SELECT * FROM system_events
      WHERE device_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [deviceId, safeLimit]);
    return rows;
  } catch (err) {
    console.error('[DB] getSystemEvents error:', err.message);
    throw err;
  }
}

/**
 * Check device connectivity and freshness
 */
export async function getDeviceStatus(deviceId, staleThresholdSeconds = 30) {
  const latest = await getLatestReading(deviceId);
  if (!latest) {
    return {
      device_id: deviceId,
      status: 'NEVER_CONNECTED',
      is_online: false,
      is_stale: false,
      last_seen: null,
      age_seconds: null
    };
  }

  const lastSeenDate = new Date(latest.received_at);
  const now = new Date();
  const ageSeconds = Math.max(0, Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000));
  const isOnline = latest.device_status === 'ONLINE' && ageSeconds <= staleThresholdSeconds;
  const isStale = ageSeconds > staleThresholdSeconds && latest.source_mode === 'HARDWARE';

  return {
    device_id: deviceId,
    status: isOnline ? 'ONLINE' : (isStale ? 'STALE' : 'OFFLINE'),
    is_online: isOnline,
    is_stale: isStale,
    last_seen: latest.received_at,
    age_seconds: ageSeconds,
    latest_reading: latest
  };
}
