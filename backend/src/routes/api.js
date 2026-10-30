/**
 * API Routes for GreyWater Guardian REST API
 */

import express from 'express';
import { authenticateDevice } from '../middleware/auth.js';
import * as telemetryCtrl from '../controllers/telemetryController.js';
import { listScenarios, getScenario } from '../services/demoService.js';
import * as db from '../database/db.js';
import {
  getSerialStatus,
  listAvailablePorts,
  startSerialCollector,
  stopSerialCollector
} from '../services/serialCollector.js';

const router = express.Router();

// 1. Hardware & Telemetry Endpoints
router.post('/telemetry', authenticateDevice, telemetryCtrl.postTelemetry);

// 2. Read Endpoints for Devices
router.get('/devices/:deviceId/latest', telemetryCtrl.getLatest);
router.get('/devices/:deviceId/history', telemetryCtrl.getHistory);
router.get('/devices/:deviceId/status', telemetryCtrl.getStatus);
router.get('/devices/:deviceId/events', telemetryCtrl.getEvents);

// 3. Rules Engine Configuration Endpoints
router.get('/rules/config', (req, res) => {
  res.json({
    status: 'SUCCESS',
    config: telemetryCtrl.getActiveRulesConfig()
  });
});

router.put('/rules/config', (req, res) => {
  const updated = telemetryCtrl.setActiveRulesConfig(req.body);
  res.json({
    status: 'SUCCESS',
    message: 'Rules configuration updated successfully',
    config: updated
  });
});

// 4. Demo Scenarios & Simulation Trigger Endpoints
router.get('/demo/scenarios', (req, res) => {
  res.json({
    status: 'SUCCESS',
    scenarios: listScenarios()
  });
});

router.post('/demo/trigger/:scenarioId', async (req, res) => {
  try {
    const scenario = getScenario(req.params.scenarioId);
    // Simulate by injecting through the controller's telemetry flow
    req.body = { ...scenario.payload };
    return telemetryCtrl.postTelemetry(req, res);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// 5. USB Serial Collector Endpoints
router.get('/serial/status', (req, res) => {
  res.json({
    status: 'SUCCESS',
    data: getSerialStatus()
  });
});

router.get('/serial/ports', async (req, res) => {
  const ports = await listAvailablePorts();
  res.json({
    status: 'SUCCESS',
    data: ports
  });
});

router.post('/serial/connect', async (req, res) => {
  const { port, baud } = req.body;
  await startSerialCollector({ port, baud });
  res.json({
    status: 'SUCCESS',
    message: `Attempting connection to ${port || 'auto-detected port'}`,
    data: getSerialStatus()
  });
});

router.post('/serial/disconnect', async (req, res) => {
  await stopSerialCollector();
  res.json({
    status: 'SUCCESS',
    message: 'Serial port disconnected',
    data: getSerialStatus()
  });
});

// 6. System Health & Database Mode
router.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'GreyWater Guardian API',
    database_mode: db.getDbMode(),
    serial_status: getSerialStatus(),
    timestamp: new Date().toISOString()
  });
});

export default router;
