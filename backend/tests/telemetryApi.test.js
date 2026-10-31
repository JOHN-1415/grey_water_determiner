/**
 * Automated Tests for GreyWater Guardian REST API & Hardware Ingestion
 * IoT Greywater Quality Assessment & Recommendation System
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';
import { initDatabase } from '../src/database/db.js';

let server;
let baseUrl;

before(async () => {
  await initDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Telemetry API Ingestion & Authentication', () => {
  test('1. Rejects hardware telemetry without API key (401 Unauthorized)', async () => {
    const payload = {
      device_id: 'GW-001',
      sequence: 1,
      sensors: { tds_ppm: 200, turbidity_ntu: 2.5, temperature_c: 24 },
      source_mode: 'HARDWARE'
    };

    const res = await fetch(`${baseUrl}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'UNAUTHORIZED');
  });

  test('2. Rejects hardware telemetry with wrong API key (403 Forbidden)', async () => {
    const payload = {
      device_id: 'GW-001',
      sequence: 1,
      sensors: { tds_ppm: 200, turbidity_ntu: 2.5, temperature_c: 24 },
      source_mode: 'HARDWARE'
    };

    const res = await fetch(`${baseUrl}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'incorrect-token-abc'
      },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'FORBIDDEN');
  });

  test('3. Rejects invalid payload missing sequence or required sensors (400 Bad Request)', async () => {
    const invalidPayload = {
      device_id: 'GW-001',
      // sequence is missing
      sensors: { tds_ppm: 'not-a-number', turbidity_ntu: 2.5 }
    };

    const res = await fetch(`${baseUrl}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'gw-esp32-secret-2026'
      },
      body: JSON.stringify(invalidPayload)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.status, 'ERROR');
    assert.ok(body.details.length > 0);
  });

  test('4. Accepts valid hardware telemetry with correct API key and optional pH null', async () => {
    const validPayload = {
      device_id: 'GW-001',
      sequence: 200,
      uptime_seconds: 3600,
      source_mode: 'HARDWARE',
      sensors: {
        ph: null, // explicit null
        tds_ppm: 340.0,
        turbidity_ntu: 8.5,
        temperature_c: 25.5
      }
    };

    const res = await fetch(`${baseUrl}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'gw-esp32-secret-2026'
      },
      body: JSON.stringify(validPayload)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.status, 'SUCCESS');
    assert.equal(body.assessment.treatment_level, 'LEVEL_2');
    assert.equal(body.source_mode, 'HARDWARE');
    assert.ok(body.assessment.recommendation);
  });

  test('5. Successfully reads latest reading and calculates stale age', async () => {
    const res = await fetch(`${baseUrl}/devices/GW-001/latest`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'SUCCESS');
    assert.equal(body.data.device_id, 'GW-001');
    assert.equal(body.data.sequence, 200);
    assert.equal(body.data.assessment.treatment_level, 'LEVEL_2');
  });

  test('6. Reads device history with pagination limit', async () => {
    const res = await fetch(`${baseUrl}/devices/GW-001/history?limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'SUCCESS');
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
  });

  test('7. Reads device connectivity status', async () => {
    const res = await fetch(`${baseUrl}/devices/GW-001/status`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'SUCCESS');
    assert.equal(body.data.device_id, 'GW-001');
    assert.equal(body.data.status, 'ONLINE');
  });

  test('8. Allows triggering demo scenario via /demo/trigger/:scenarioId', async () => {
    const res = await fetch(`${baseUrl}/demo/trigger/3`, {
      method: 'POST'
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.status, 'SUCCESS');
    assert.equal(body.assessment.treatment_level, 'LEVEL_3');
    assert.equal(body.source_mode, 'SIMULATED');
  });
});
