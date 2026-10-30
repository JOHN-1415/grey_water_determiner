/**
 * Main Server Entry Point for GreyWater Guardian Backend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { initDatabase, getDbMode } from './database/db.js';
import { getScenario } from './services/demoService.js';
import * as telemetryCtrl from './controllers/telemetryController.js';
import { startSerialCollector } from './services/serialCollector.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', apiRoutes);

// Root greeting & status
app.get('/', (req, res) => {
  res.json({
    name: 'GreyWater Guardian API',
    version: '1.0.0',
    documentation: '/docs/API_CONTRACT.md',
    status: 'ACTIVE',
    endpoints: {
      telemetry: 'POST /api/v1/telemetry',
      latest_device: 'GET /api/v1/devices/:deviceId/latest',
      history: 'GET /api/v1/devices/:deviceId/history',
      status: 'GET /api/v1/devices/:deviceId/status',
      events: 'GET /api/v1/devices/:deviceId/events',
      demo_scenarios: 'GET /api/v1/demo/scenarios',
      trigger_demo: 'POST /api/v1/demo/trigger/:scenarioId'
    }
  });
});

/**
 * Bootstrap Server
 */
export async function startServer() {
  await initDatabase();

  // Seed default demonstration telemetry on boot if needed
  try {
    const demoPayload = getScenario(1).payload;
    const mockReq = { body: { ...demoPayload } };
    const mockRes = {
      status: () => ({ json: () => {} }),
      json: () => {}
    };
    await telemetryCtrl.postTelemetry(mockReq, mockRes);
    console.log('[Bootstrap] Initialized demo baseline telemetry for device GW-001');
  } catch (err) {
    console.warn('[Bootstrap] Demo baseline seed notice:', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`GreyWater Guardian Backend running on port ${PORT}`);
    console.log(`Mode: ${getDbMode()}`);
    console.log(`REST API: http://localhost:${PORT}/api/v1`);
    console.log(`====================================================`);
  });

  // Launch background USB Serial Collector if enabled
  if (process.env.SERIAL_AUTO_START !== 'false') {
    try {
      await startSerialCollector();
    } catch (err) {
      console.warn('[Bootstrap] Serial collector auto-start notice:', err.message);
    }
  }

  return server;
}

// Start automatically only when run directly (e.g. `node src/server.js`)
import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain && process.env.NODE_ENV !== 'test') {
  startServer();
}
