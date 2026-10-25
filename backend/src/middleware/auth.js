/**
 * API Key Authentication Middleware for ESP32 and Hardware Clients
 */

const DEFAULT_API_KEY = process.env.DEVICE_API_KEY || 'gw-esp32-secret-2026';

export function authenticateDevice(req, res, next) {
  // Allow demo simulation requests to bypass key if explicitly tagged as simulation
  if (req.body && req.body.source_mode === 'SIMULATED') {
    return next();
  }

  const apiKeyHeader = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  let token = null;
  if (apiKeyHeader) {
    token = apiKeyHeader.trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  const expectedKey = process.env.DEVICE_API_KEY || DEFAULT_API_KEY;

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing device API key. Provide header "X-API-Key" or "Authorization: Bearer <key>".'
    });
  }

  if (token !== expectedKey) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Invalid device API key.'
    });
  }

  next();
}
