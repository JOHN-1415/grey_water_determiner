import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseKiwiLine } from '../src/services/kiwiParser.js';

describe('KiwiIoT Legacy Stream Parser', () => {
  test('1. Parses text block lines from physical ESP32', () => {
    const lines = [
      'Water Monitoring Started',
      '---------------------------',
      'Turbidity raw ADC: 3555',
      'Dust density: 0.0 %',
      'Temperature: 30.56 C',
      'Pump: OFF',
      '[MQTT] Connecting... Connected',
      '[MQTT] Subscribed: dash_1793279376204',
      '---------------------------'
    ];

    let emitted = null;
    for (const l of lines) {
      const res = parseKiwiLine(l);
      if (res) emitted = res;
    }

    assert.ok(emitted, 'Should have emitted telemetry record');
    assert.equal(emitted.device_id, 'GW-001');
    assert.equal(emitted.sensors.temperature_c, 30.6);
    assert.ok(emitted.sensors.turbidity_ntu >= 0 && emitted.sensors.turbidity_ntu <= 5.0);
    assert.equal(emitted.source_mode, 'HARDWARE');
  });

  test('2. Parses channel and JSON lines from KiwiIoT', () => {
    const lines = [
      '[RX] CH=1 VAL=30.437500',
      'Received -> channel: 1 value: 30.437500',
      '[RX] CH=2 VAL=0',
      'Received -> channel: 2 value: 0',
      '[RX] CH=3 VAL=3541',
      'Received -> channel: 3 value: 3541',
      '[TX] {"0":0.000000}',
      '[TX] {"1":30.437500}',
      '[TX] {"2":0}',
      '[TX] {"3":3541}',
      '[TX] {"4":"Normal"}',
      'Data sent to KiwiIoT'
    ];

    let emitted = null;
    for (const l of lines) {
      const res = parseKiwiLine(l);
      if (res) emitted = res;
    }

    assert.ok(emitted, 'Should have emitted telemetry record');
    assert.equal(emitted.sensors.temperature_c, 30.4);
    assert.ok(emitted.sensors.turbidity_ntu >= 0 && emitted.sensors.turbidity_ntu <= 5.0);
    assert.equal(emitted.source_mode, 'HARDWARE');
  });
});
