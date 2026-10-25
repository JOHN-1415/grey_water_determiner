# GreyWater Guardian — REST API Specification & Hardware Contract

Version: 1.0.0  
Target Deployment Date: 2 November 2026  
Protocol: HTTP/REST  
Payload Format: JSON  
Default Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication

Endpoints that receive telemetry from physical hardware require device-level API key authentication.

### Authentication Headers
You must supply the API key in either of the following headers:
- `X-API-Key: <device_api_key>`
- `Authorization: Bearer <device_api_key>`

Default Development Key: `gw-esp32-secret-2026` (configurable via `DEVICE_API_KEY` in `.env`).

*Note:* Telemetry explicitly tagged with `"source_mode": "SIMULATED"` bypasses authentication to allow offline demo testing.

---

## 2. Ingestion Endpoints

### `POST /api/v1/telemetry`
Receives live telemetry transmissions from the ESP32 microcontroller or simulated testbed.

#### Request Headers
```http
Content-Type: application/json
X-API-Key: gw-esp32-secret-2026
```

#### Request Payload Specification
```json
{
  "device_id": "GW-001",
  "sequence": 1042,
  "uptime_seconds": 5200,
  "source_mode": "HARDWARE",
  "device_status": "ONLINE",
  "sensors": {
    "ph": 7.1,
    "tds_ppm": 420.0,
    "turbidity_ntu": 18.0,
    "temperature_c": 27.4
  },
  "treatment": {
    "active_stage": 2,
    "stage_1": "COMPLETED",
    "stage_2": "ACTIVE",
    "stage_3": "BYPASSED",
    "pump_status": "ON"
  },
  "output_sensors": {
    "ph": 7.2,
    "tds_ppm": 210.0,
    "turbidity_ntu": 2.4,
    "temperature_c": 26.8
  }
}
```

#### Payload Fields & Validation Rules

| Field | Type | Required | Description |
|---|---|---|---|
| `device_id` | String | Yes | Unique alphanumeric device identifier (e.g., `"GW-001"`). |
| `sequence` | Integer (>= 0) | Yes | Incrementing packet sequence counter to detect duplicates and dropped packets. |
| `uptime_seconds` | Number (>= 0) | Yes | Controller uptime in seconds. |
| `source_mode` | String | No | `"HARDWARE"` or `"SIMULATED"`. Defaults to `"HARDWARE"`. |
| `device_status` | String | No | `"ONLINE"`, `"OFFLINE"`, or `"SENSOR_ERROR"`. |
| `sensors.ph` | Number or `null` | **Optional** | pH reading (0.0 – 14.0). Must be set to `null` if probe is uninstalled. |
| `sensors.tds_ppm` | Number (0 – 5000) | **Yes** | Total Dissolved Solids in parts per million. |
| `sensors.turbidity_ntu` | Number (0 – 2000) | **Yes** | Nephelometric Turbidity Units. |
| `sensors.temperature_c` | Number (0 – 80) | **Yes** | DS18B20 digital temperature reading in Celsius. |
| `treatment.active_stage` | Integer or `null` | No | Currently active physical stage (1, 2, or 3). |
| `treatment.pump_status` | String | No | `"ON"` or `"OFF"`. |
| `output_sensors` | Object or `null` | No | Optional secondary sensors measuring post-treatment effluent quality. |

#### Successful Response (`201 Created`)
```json
{
  "status": "SUCCESS",
  "message": "Telemetry processed and persisted",
  "received_at": "2026-10-24T11:40:00.000Z",
  "device_id": "GW-001",
  "sequence": 1042,
  "sequence_warning": null,
  "source_mode": "HARDWARE",
  "assessment": {
    "treatment_level": "MEDIUM",
    "assessment_status": "MODERATE_CONTAMINATION",
    "explanation": "Medium treatment (Stages 1 & 2: sediment + activated carbon) is recommended because: Turbidity (18.0 NTU) exceeds basic threshold (5.0 NTU); TDS (420 ppm) exceeds basic threshold (300 ppm).",
    "stage_mapping": {
      "stage_1": "ACTIVE",
      "stage_2": "ACTIVE",
      "stage_3": "BYPASSED",
      "description": "Physical filtration + Activated carbon adsorption"
    },
    "parameters_considered": ["turbidity_ntu", "tds_ppm", "temperature_c"],
    "parameters_outside_criteria": ["turbidity_ntu", "tds_ppm"]
  },
  "reading_id": 142
}
```

#### Error Responses
- `400 Bad Request`: Payload validation failed (missing required field, non-finite number, or implausible reading).
- `401 Unauthorized`: Missing `X-API-Key` or `Authorization` header for hardware telemetry.
- `403 Forbidden`: Invalid API key supplied.
- `500 Internal Server Error`: Server or database failure.

---

## 3. Read & Monitoring Endpoints

### `GET /api/v1/devices/:deviceId/latest`
Returns the most recent persisted telemetry packet and freshly evaluated rules engine assessment.

### `GET /api/v1/devices/:deviceId/history?limit=100`
Returns historical sensor readings for charts and analytics (default limit 100, max 500).

### `GET /api/v1/devices/:deviceId/status`
Returns connectivity health, last seen timestamp, and whether readings are considered stale (>30s).

### `GET /api/v1/devices/:deviceId/events?limit=50`
Returns system audit log including sequence anomalies, packet loss notifications, and stage mismatch alerts.

---

## 4. Configuration & Demo Endpoints

### `GET /api/v1/rules/config`
Retrieves currently active classification thresholds (TDS limits, turbidity limits, pH bounds).

### `PUT /api/v1/rules/config`
Updates runtime thresholds dynamically without requiring a server reboot.

### `GET /api/v1/demo/scenarios`
Lists all 10 deterministic test scenarios.

### `POST /api/v1/demo/trigger/:scenarioId`
Simulates and injects scenario `1` through `10` through the full telemetry validation and rules pipeline.
