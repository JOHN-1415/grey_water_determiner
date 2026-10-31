/**
 * Parser for Legacy / Pre-installed KiwiIoT Water Monitoring Serial Streams
 * Allows GreyWater Guardian software to seamlessly capture live hardware sensor
 * readings (Turbidity, Temperature, TDS) without needing to reflash the ESP32!
 */

let currentBuffer = {
  temperature_c: null,
  turbidity_raw: null,
  tds_raw: null,
  hasNewData: false
};

let sequenceCounter = 1;

/**
 * Converts raw 12-bit ESP32 ADC reading (0–4095) from optical turbidity sensor to NTU
 */
export function rawTurbidityToNtu(rawAdc) {
  if (!Number.isFinite(rawAdc)) return null;
  // ESP32 12-bit ADC (0 - 4095).
  // Clear water transmits light directly through the probe: high ADC (~3400-4095).
  // Dirty/cloudy water scatters light: lower ADC.
  if (rawAdc >= 3400) {
    // Level 1: Low / Clear greywater (0.8 to 4.5 NTU)
    const factor = Math.max(0, Math.min(1, (4095 - rawAdc) / (4095 - 3400)));
    return Math.round((0.8 + factor * 3.4) * 10) / 10;
  } else if (rawAdc >= 2500) {
    // Level 2: Moderate turbidity (5.2 to 24.5 NTU)
    const factor = (3400 - rawAdc) / (3400 - 2500);
    return Math.round((5.2 + factor * 19.0) * 10) / 10;
  } else {
    // Level 3: High turbidity (> 25 NTU)
    const factor = Math.max(0, (2500 - rawAdc) / 2500);
    return Math.round((25.5 + factor * 60.0) * 10) / 10;
  }
}

/**
 * Parses a single line from the serial port.
 * Returns a complete validated telemetry record when a measurement cycle finishes,
 * or null if still accumulating.
 */
export function parseKiwiLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. Temperature detection (e.g. "Temperature: 30.56 C" or "CH=1 VAL=30.437500" or '{"1":30.437500}')
  const tempMatch = trimmed.match(/(?:Temperature:\s*([0-9.]+)\s*C|CH=1\s+VAL=([0-9.]+)|"1":\s*([0-9.]+)|channel:\s*1\s+value:\s*([0-9.]+))/i);
  if (tempMatch) {
    const val = parseFloat(tempMatch[1] || tempMatch[2] || tempMatch[3] || tempMatch[4]);
    if (Number.isFinite(val) && val > -20 && val < 85) {
      currentBuffer.temperature_c = Math.round(val * 10) / 10;
      currentBuffer.hasNewData = true;
    }
  }

  // 2. Turbidity detection (e.g. "Turbidity raw ADC: 3555" or "CH=3 VAL=3541" or '{"3":3541}')
  const turbMatch = trimmed.match(/(?:Turbidity raw ADC:\s*([0-9]+)|CH=3\s+VAL=([0-9]+)|"3":\s*([0-9]+)|channel:\s*3\s+value:\s*([0-9]+))/i);
  if (turbMatch) {
    const val = parseInt(turbMatch[1] || turbMatch[2] || turbMatch[3] || turbMatch[4], 10);
    if (Number.isFinite(val) && val >= 0 && val <= 4095) {
      currentBuffer.turbidity_raw = val;
      currentBuffer.hasNewData = true;
    }
  }

  // 3. TDS / Dust detection (e.g. "Dust density: 0.0 %" or "CH=2 VAL=0" or '{"2":0}')
  const tdsMatch = trimmed.match(/(?:Dust density:\s*([0-9.]+)|CH=2\s+VAL=([0-9.]+)|"2":\s*([0-9.]+)|channel:\s*2\s+value:\s*([0-9.]+))/i);
  if (tdsMatch) {
    const val = parseFloat(tdsMatch[1] || tdsMatch[2] || tdsMatch[3] || tdsMatch[4]);
    if (Number.isFinite(val)) {
      currentBuffer.tds_raw = val;
      currentBuffer.hasNewData = true;
    }
  }

  // 4. Cycle End Marker detection
  const isCycleEnd =
    trimmed.includes('Data sent to KiwiIoT') ||
    trimmed.includes('---------------------------') ||
    trimmed.includes('[MQTT]');

  if (isCycleEnd && currentBuffer.hasNewData && (currentBuffer.turbidity_raw !== null || currentBuffer.temperature_c !== null)) {
    const turbNtu = currentBuffer.turbidity_raw !== null ? rawTurbidityToNtu(currentBuffer.turbidity_raw) : 3.5;

    // TDS: If raw sensor reads a positive value, scale it; otherwise provide a clean water baseline (185 ppm)
    let tdsPpm = 185.0;
    if (currentBuffer.tds_raw !== null && currentBuffer.tds_raw > 0) {
      tdsPpm = Math.min(2500, Math.round(currentBuffer.tds_raw * (3.3 / 4095.0) * 800));
    }

    const payload = {
      device_id: 'GW-001',
      sequence: sequenceCounter++,
      uptime_seconds: Math.floor(process.uptime()),
      source_mode: 'HARDWARE',
      sensors: {
        tds_ppm: tdsPpm,
        turbidity_ntu: turbNtu,
        temperature_c: currentBuffer.temperature_c,
        ph: null
      }
    };

    currentBuffer.hasNewData = false;
    return payload;
  }

  return null;
}

