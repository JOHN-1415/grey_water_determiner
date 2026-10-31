# GreyWater Guardian — REST API Specification & Hardware Contract
## IoT Greywater Quality Assessment and Treatment Recommendation System

Version: 2.0.0  
Protocol: HTTP/REST & USB Serial JSON  
Payload Format: JSON  
Default Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication

Endpoints that receive telemetry from physical hardware require device-level API key authentication.

### Authentication Headers
- `X-API-Key: <device_api_key>`
- `Authorization: Bearer <device_api_key>`

Default Development Key: `gw-esp32-secret-2026` (configurable via `DEVICE_API_KEY` in `.env`).

---

## 2. Telemetry Ingestion Endpoints

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
    "ph": null,
    "tds_ppm": 420.0,
    "turbidity_ntu": 18.0,
    "temperature_c": 27.4
  },
  "classification": "LEVEL_2"
}
```

*Note:* Flat payloads emitted by USB Serial are also accepted:
```json
{"device_id":"GW-001","sequence":1042,"temperature_c":27.4,"tds_ppm":420.0,"turbidity_ntu":18.0,"classification":"LEVEL_2","source_mode":"HARDWARE"}
```

#### Successful Response (`201 Created`)
```json
{
  "status": "SUCCESS",
  "message": "Telemetry evaluated and saved",
  "received_at": "2026-10-31T12:00:00.000Z",
  "device_id": "GW-001",
  "sequence": 1042,
  "sequence_warning": null,
  "source_mode": "HARDWARE",
  "assessment": {
    "treatment_level": "LEVEL_2",
    "assessment_status": "MODERATE_CONTAMINATION",
    "explanation": "Level 2 (Moderate treatment) recommended because: Turbidity (18.0 NTU) exceeds Level 1 limit (5.0 NTU); TDS (420 ppm) exceeds Level 1 limit (300 ppm).",
    "reasons": [
      "Turbidity (18.0 NTU) exceeds Level 1 limit (5.0 NTU)",
      "TDS (420 ppm) exceeds Level 1 limit (300 ppm)"
    ],
    "recommendation": {
      "assigned_level": "LEVEL_2",
      "title": "Level 2: Moderate Treatment Recommendation",
      "summary": "Water exhibits moderate turbidity or dissolved organics/soaps. Requires physical filtration combined with adsorption.",
      "suggested_treatment_methods": [
        "Fine mesh / cartridge pre-filtration (20–50 µm)",
        "Granular Activated Carbon (GAC) adsorption",
        "Multi-barrier slow sand filtration"
      ],
      "scientific_limitations": [
        "Sensors measure only select physical indicators (turbidity, TDS, temperature).",
        "Does NOT certify drinking water safety or potability.",
        "Does NOT confirm microbiological safety.",
        "Informational recommendation only; prototype does NOT physically filter water."
      ]
    }
  },
  "reading_id": 42
}
```

---

## 3. Query Endpoints

- `GET /api/v1/devices/:deviceId/latest`: Retrieves latest sensor readings & assessment details.
- `GET /api/v1/devices/:deviceId/history?limit=100`: Returns chronological sensor telemetry.
- `GET /api/v1/devices/:deviceId/status`: Returns device online/stale status.
- `GET /api/v1/devices/:deviceId/events`: Returns system events and anomaly records.
- `GET /api/v1/rules/config`: Retrieves active water quality classification thresholds.
- `PUT /api/v1/rules/config`: Updates thresholds in real-time.
- `GET /api/v1/serial/status`: Returns USB Serial collector connection health.
