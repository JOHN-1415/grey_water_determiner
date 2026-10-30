/**
 * GreyWater Guardian — ESP32 Serial Collector Service
 *
 * Connects to ESP32 over USB Serial, parses newline-delimited JSON telemetry,
 * validates incoming records, handles reconnections, prevents duplicate processing,
 * and pushes telemetry to the backend database & rules engine.
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { validateTelemetryPayload } from '../validation/telemetryValidation.js';
import { assessWaterQuality, DEFAULT_RULES_CONFIG } from './rulesEngine.js';
import * as db from '../database/db.js';

// Status tracking state
const state = {
  status: 'DISCONNECTED', // 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'RETRYING'
  portPath: null,
  baudRate: 115200,
  autoDetected: false,
  lastPacketTime: null,
  lastSequence: null,
  packetCount: 0,
  errorCount: 0,
  lastError: null,
  availablePorts: []
};

// Map of processed sequences per device to prevent duplicate storage
const processedSequences = new Map();

let activePort = null;
let activeParser = null;
let reconnectTimer = null;
let isStopping = false;

/**
 * Returns the current collector status and data freshness
 */
export function getSerialStatus() {
  const now = Date.now();
  const lastPacketAgeSeconds = state.lastPacketTime
    ? Math.max(0, Math.floor((now - new Date(state.lastPacketTime).getTime()) / 1000))
    : null;

  return {
    ...state,
    is_fresh: lastPacketAgeSeconds !== null && lastPacketAgeSeconds <= 15,
    seconds_since_last_packet: lastPacketAgeSeconds
  };
}

/**
 * Scans available serial ports on the host system
 */
export async function listAvailablePorts() {
  try {
    const ports = await SerialPort.list();
    state.availablePorts = ports.map((p) => ({
      path: p.path,
      friendlyName: p.friendlyName || p.path,
      manufacturer: p.manufacturer || 'Unknown',
      vendorId: p.vendorId,
      productId: p.productId
    }));
    return state.availablePorts;
  } catch (err) {
    console.error('[SerialCollector] Error listing ports:', err.message);
    return [];
  }
}

/**
 * Auto-detects an ESP32 or USB-to-UART bridge port
 */
async function autoDetectEsp32Port() {
  const ports = await listAvailablePorts();
  if (ports.length === 0) return null;

  // Known ESP32 USB-to-UART bridge patterns:
  // Silicon Labs CP210x (10c4:ea60), WCH CH340 (1a86:7523), FTDI (0403), etc.
  const esp32Port = ports.find((p) => {
    const fn = (p.friendlyName || '').toLowerCase();
    const mfg = (p.manufacturer || '').toLowerCase();
    const vid = (p.vendorId || '').toLowerCase();

    return (
      fn.includes('cp210') ||
      fn.includes('ch340') ||
      fn.includes('uart') ||
      fn.includes('esp32') ||
      mfg.includes('silicon labs') ||
      mfg.includes('wch') ||
      vid === '10c4' ||
      vid === '1a86'
    );
  });

  return esp32Port ? esp32Port.path : null;
}

/**
 * Processes a validated telemetry line and persists to DB
 */
async function processTelemetryRecord(record) {
  const validation = validateTelemetryPayload(record);
  if (!validation.isValid) {
    state.errorCount++;
    console.warn('[SerialCollector] Invalid telemetry payload:', validation.errors.join('; '));
    await db.logEvent(record.device_id || 'GW-001', 'SERIAL_VALIDATION_ERROR', validation.errors.join('; '), 'WARNING');
    return false;
  }

  const data = validation.data;
  const deviceId = data.device_id;
  const sequence = data.sequence;

  // Prevent duplicate processing
  const lastSeq = processedSequences.get(deviceId);
  if (lastSeq !== undefined && sequence <= lastSeq) {
    console.log(`[SerialCollector] Skipping duplicate sequence #${sequence} for ${deviceId}`);
    return false;
  }
  processedSequences.set(deviceId, sequence);

  // Assess Water Quality using the rules engine
  const assessment = assessWaterQuality(data.sensors, null, {
    is_offline: false,
    is_stale: false
  });

  const recordToSave = {
    device_id: deviceId,
    sequence: sequence,
    uptime_seconds: data.uptime_seconds,
    received_at: new Date().toISOString(),
    sensors: data.sensors,
    output_sensors: data.output_sensors,
    device_status: data.device_status || 'ONLINE',
    source_mode: 'HARDWARE',
    treatment: {
      active_stage: data.treatment?.active_stage ?? 1,
      stage_1: data.treatment?.pump_status === 'ON' ? 'ACTIVE' : 'IDLE',
      stage_2: 'NOT_INSTALLED',
      stage_3: 'NOT_INSTALLED',
      pump_status: data.treatment?.pump_status || 'UNKNOWN'
    },
    assessment,
    raw_payload: record
  };

  await db.saveReading(recordToSave);

  state.lastPacketTime = recordToSave.received_at;
  state.lastSequence = sequence;
  state.packetCount++;

  console.log(
    `[SerialCollector] Received Telemetry #${sequence} -> ` +
    `Temp: ${data.sensors.temperature_c !== null ? data.sensors.temperature_c + '°C' : 'N/A'}, ` +
    `TDS: ${data.sensors.tds_ppm} ppm, Turbidity: ${data.sensors.turbidity_ntu} NTU, ` +
    `Class: ${assessment.treatment_level}, Pump: ${recordToSave.treatment.pump_status}`
  );

  return true;
}

/**
 * Connects to the serial port
 */
async function connect(targetPort, baudRate) {
  if (isStopping) return;

  state.status = 'CONNECTING';
  state.portPath = targetPort;
  state.baudRate = baudRate;

  console.log(`[SerialCollector] Connecting to serial port '${targetPort}' at ${baudRate} baud...`);

  try {
    activePort = new SerialPort({
      path: targetPort,
      baudRate: baudRate,
      autoOpen: false
    });

    activeParser = activePort.pipe(new ReadlineParser({ delimiter: '\n' }));

    activePort.open((err) => {
      if (err) {
        state.status = 'DISCONNECTED';
        state.lastError = err.message;
        console.error(`[SerialCollector] Failed to open port '${targetPort}':`, err.message);
        if (err.message.includes('Access denied')) {
          console.warn(`[SerialCollector] Notice: Port '${targetPort}' is held open by another program (e.g. Arduino Serial Monitor). Close Arduino Serial Monitor to allow the collector to access the port.`);
        }
        scheduleReconnect();
        return;
      }

      state.status = 'CONNECTED';
      state.lastError = null;
      console.log(`[SerialCollector] Successfully connected to ESP32 on '${targetPort}'!`);
      db.logEvent('GW-001', 'SERIAL_CONNECTED', `Connected to serial port ${targetPort} at ${baudRate} baud`, 'INFO');
    });

    activeParser.on('data', async (line) => {
      const trimmed = line.toString().trim();
      if (!trimmed) return;

      // Handle diagnostic prefixes from firmware
      if (trimmed.startsWith('[BOOT]') || trimmed.startsWith('[DIAG]') || trimmed.startsWith('[INFO]')) {
        console.log(`[ESP32 DIAG] ${trimmed}`);
        return;
      }

      // Parse JSON telemetry
      try {
        const payload = JSON.parse(trimmed);
        await processTelemetryRecord(payload);
      } catch (parseErr) {
        state.errorCount++;
        // Ignore partial/unrecognized non-JSON lines without crashing
        console.warn(`[SerialCollector] Non-JSON or malformed data received: ${trimmed.substring(0, 80)}`);
      }
    });

    activePort.on('error', (err) => {
      console.error('[SerialCollector] Port error:', err.message);
      state.lastError = err.message;
      state.status = 'DISCONNECTED';
      scheduleReconnect();
    });

    activePort.on('close', () => {
      console.warn(`[SerialCollector] Port '${targetPort}' closed.`);
      state.status = 'DISCONNECTED';
      scheduleReconnect();
    });
  } catch (err) {
    state.status = 'DISCONNECTED';
    state.lastError = err.message;
    console.error(`[SerialCollector] Connection error on '${targetPort}':`, err.message);
    scheduleReconnect();
  }
}

/**
 * Schedules a reconnection attempt
 */
function scheduleReconnect() {
  if (isStopping || reconnectTimer) return;

  state.status = 'RETRYING';
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (isStopping) return;

    let portToTry = state.portPath;
    if (state.autoDetected || !portToTry) {
      const detected = await autoDetectEsp32Port();
      if (detected) {
        portToTry = detected;
        state.portPath = detected;
      }
    }

    if (portToTry) {
      connect(portToTry, state.baudRate);
    } else {
      console.log('[SerialCollector] Searching for connected ESP32 USB serial device...');
      scheduleReconnect();
    }
  }, 4000);
}

/**
 * Starts the serial collector service
 */
export async function startSerialCollector(options = {}) {
  isStopping = false;

  const baudRate = Number(options.baud || process.env.SERIAL_BAUD || 115200);

  // 1. Specified port from options, CLI args, or env var
  let targetPort = options.port || process.env.SERIAL_PORT || process.env.ESP32_PORT;

  // Parse command line arguments if run directly (e.g., node serialCollector.js --port COM7)
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      targetPort = args[i + 1];
    }
    if (args[i] === '--baud' && args[i + 1]) {
      targetPort = Number(args[i + 1]);
    }
  }

  // 2. Auto-detect if not explicitly configured
  if (!targetPort) {
    state.autoDetected = true;
    console.log('[SerialCollector] No COM port specified. Scanning available USB serial devices...');
    targetPort = await autoDetectEsp32Port();
    if (targetPort) {
      console.log(`[SerialCollector] Auto-detected ESP32 device at '${targetPort}'`);
    } else {
      console.warn('[SerialCollector] No active ESP32 device found. Will keep scanning in background.');
    }
  }

  state.baudRate = baudRate;
  state.portPath = targetPort;

  if (targetPort) {
    connect(targetPort, baudRate);
  } else {
    scheduleReconnect();
  }
}

/**
 * Stops the serial collector service cleanly
 */
export async function stopSerialCollector() {
  isStopping = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (activePort && activePort.isOpen) {
    return new Promise((resolve) => {
      activePort.close(() => {
        state.status = 'DISCONNECTED';
        console.log('[SerialCollector] Serial port closed cleanly.');
        resolve();
      });
    });
  }
  state.status = 'DISCONNECTED';
}

// Standalone execution support: `node src/services/serialCollector.js`
import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  console.log('====================================================');
  console.log('GreyWater Guardian — Node.js Serial Collector');
  console.log('====================================================');

  await db.initDatabase();
  await startSerialCollector();

  process.on('SIGINT', async () => {
    console.log('\n[SerialCollector] Shutting down...');
    await stopSerialCollector();
    process.exit(0);
  });
}
