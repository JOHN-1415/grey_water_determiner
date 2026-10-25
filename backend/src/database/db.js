/**
 * Database Layer for GreyWater Guardian
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
    ['GW-001', { device_id: 'GW-001', device_name: 'ESP32 Main Greywater Monitor', last_seen_at: new Date().toISOString() }]
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

    // Test ping
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
export async function upsertDevice(deviceId, deviceName = 'ESP32 Monitor') {
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
 * Save new sensor reading
 */
export async function saveReading(reading) {
  const receivedAt = reading.received_at ? new Date(reading.received_at) : new Date();

  if (isUsingFallback || !pool) {
    const record = {
      id: inMemoryStore.readings.length + 1,
      device_id: reading.device_id,
      received_at: receivedAt.toISOString(),
      sequence: reading.sequence,
      ph: reading.sensors.ph !== undefined ? reading.sensors.ph : null,
      tds_ppm: reading.sensors.tds_ppm,
      turbidity_ntu: reading.sensors.turbidity_ntu,
      temperature_c: reading.sensors.temperature_c,
      device_status: reading.device_status || 'ONLINE',
      source_mode: reading.source_mode || 'HARDWARE',
      assessment_status: reading.assessment?.assessment_status || 'UNKNOWN',
      recommended_treatment_level: reading.assessment?.treatment_level || 'UNKNOWN',
      active_stage: reading.treatment?.active_stage ?? null,
      pump_status: reading.treatment?.pump_status || null,
      stage_1: reading.treatment?.stage_1 || null,
      stage_2: reading.treatment?.stage_2 || null,
      stage_3: reading.treatment?.stage_3 || null,
      output_sensors: reading.output_sensors || null,
      raw_payload: reading.raw_payload || reading
    };
    inMemoryStore.readings.push(record);
    // Keep max 500 readings in memory
    if (inMemoryStore.readings.length > 500) {
      inMemoryStore.readings.shift();
    }
    // Update device last seen
    upsertDevice(reading.device_id);
    return record;
  }

  try {
    await upsertDevice(reading.device_id);

    const query = `
      INSERT INTO sensor_readings (
        device_id, received_at, sequence, ph, tds_ppm, turbidity_ntu, temperature_c,
        device_status, source_mode, assessment_status, recommended_treatment_level,
        active_stage, pump_status, output_ph, output_tds_ppm, output_turbidity_ntu,
        output_temperature_c, raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const out = reading.output_sensors || {};
    const values = [
      reading.device_id,
      receivedAt,
      reading.sequence,
      reading.sensors.ph ?? null,
      reading.sensors.tds_ppm,
      reading.sensors.turbidity_ntu,
      reading.sensors.temperature_c,
      reading.device_status || 'ONLINE',
      reading.source_mode || 'HARDWARE',
      reading.assessment?.assessment_status || 'UNKNOWN',
      reading.assessment?.treatment_level || 'UNKNOWN',
      reading.treatment?.active_stage ?? null,
      reading.treatment?.pump_status || null,
      out.ph ?? null,
      out.tds_ppm ?? null,
      out.turbidity_ntu ?? null,
      out.temperature_c ?? null,
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
  const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 500);

  if (isUsingFallback || !pool) {
    const list = inMemoryStore.readings
      .filter((r) => r.device_id === deviceId)
      .slice(-safeLimit)
      .reverse();
    return list;
  }

  try {
    const query = `
      SELECT * FROM sensor_readings
      WHERE device_id = ?
      ORDER BY received_at DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(query, [deviceId, safeLimit]);
    return rows;
  } catch (err) {
    console.error('[DB] getReadingHistory error:', err.message);
    throw err;
  }
}

/**
 * Fetch device status and connectivity info
 */
export async function getDeviceStatus(deviceId, staleTimeoutSeconds = 30) {
  let device = null;
  let latest = null;

  if (isUsingFallback || !pool) {
    device = inMemoryStore.devices.get(deviceId) || { device_id: deviceId, device_name: 'ESP32 Monitor' };
    const list = inMemoryStore.readings.filter((r) => r.device_id === deviceId);
    latest = list.length > 0 ? list[list.length - 1] : null;
  } else {
    try {
      const [devRows] = await pool.execute('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
      device = devRows[0] || null;
      latest = await getLatestReading(deviceId);
    } catch (err) {
      console.error('[DB] getDeviceStatus error:', err.message);
    }
  }

  const now = Date.now();
  let connectivity = 'UNKNOWN';
  let secondsSinceLastReading = null;

  if (latest && latest.received_at) {
    const lastTime = new Date(latest.received_at).getTime();
    secondsSinceLastReading = Math.max(0, Math.floor((now - lastTime) / 1000));

    if (latest.device_status === 'OFFLINE' || latest.device_status === 'ERROR') {
      connectivity = latest.device_status;
    } else if (secondsSinceLastReading > staleTimeoutSeconds) {
      connectivity = 'STALE_DATA';
    } else {
      connectivity = 'ONLINE';
    }
  } else {
    connectivity = 'OFFLINE';
  }

  return {
    device_id: deviceId,
    device_name: device?.device_name || 'ESP32 Greywater Guardian',
    connectivity,
    seconds_since_last_reading: secondsSinceLastReading,
    last_seen_at: latest?.received_at || device?.last_seen_at || null,
    source_mode: latest?.source_mode || 'SIMULATED',
    latest_reading: latest
  };
}

/**
 * Log System Event
 */
export async function logEvent(deviceId, eventType, message, severity = 'INFO') {
  const createdAt = new Date();
  if (isUsingFallback || !pool) {
    const item = {
      id: inMemoryStore.events.length + 1,
      device_id: deviceId,
      event_type: eventType,
      message,
      severity,
      created_at: createdAt.toISOString()
    };
    inMemoryStore.events.push(item);
    if (inMemoryStore.events.length > 300) inMemoryStore.events.shift();
    return item;
  }

  try {
    const query = `
      INSERT INTO system_events (device_id, event_type, message, severity, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [deviceId, eventType, message, severity, createdAt]);
    return { id: result.insertId, device_id: deviceId, event_type: eventType, message, severity, created_at: createdAt.toISOString() };
  } catch (err) {
    console.error('[DB] logEvent error:', err.message);
  }
}

/**
 * Get recent system events
 */
export async function getSystemEvents(deviceId, limit = 50) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 200);

  if (isUsingFallback || !pool) {
    return inMemoryStore.events
      .filter((e) => !deviceId || e.device_id === deviceId)
      .slice(-safeLimit)
      .reverse();
  }

  try {
    const query = deviceId
      ? `SELECT * FROM system_events WHERE device_id = ? ORDER BY created_at DESC LIMIT ?`
      : `SELECT * FROM system_events ORDER BY created_at DESC LIMIT ?`;
    const params = deviceId ? [deviceId, safeLimit] : [safeLimit];
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.error('[DB] getSystemEvents error:', err.message);
    throw err;
  }
}
