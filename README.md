# GreyWater Guardian — Adaptive Greywater Quality Detection & Filtration System

[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blue.svg)](https://vite.dev)
[![React 19](https://img.shields.io/badge/React-19.3-cyan.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/Database-MySQL%20%7C%20In--Memory-orange.svg)](https://mysql.com)
[![Tests Passing](https://img.shields.io/badge/Tests-17%20Passed-brightgreen.svg)]()

> **Target Review Date:** 2 November 2026  
> **Course / Field:** Environmental Science / Water Conservation & IoT Engineering  
> **Application Type:** Progressive Web Application (PWA) + REST Backend

---

## 1. Project Overview

Domestic greywater generated from wash basins, showers, and laundry often gets discharged without reuse, despite significant portions being recyclable for non-potable domestic tasks (toilet flushing, landscape irrigation, floor cleaning, vehicle rinsing).

Because contamination levels vary drastically depending on the source (light washbasin rinse vs heavily soiled laundry), a fixed single-stage filter is inefficient or insufficient.

**GreyWater Guardian** implements an adaptive, deterministic rules engine paired with an ESP32 IoT telemetry stack. The system continuously evaluates incoming water quality characteristics (TDS, Turbidity, DS18B20 Temperature, and optional pH) to classify required treatment:
- **`BASIC`**: Routes water through Stage 1 Physical/Sediment mesh only.
- **`MEDIUM`**: Automatically adds Stage 2 Activated Carbon adsorption.
- **`HIGH`**: Automatically routes through Stage 3 Fine Filtration module.
- **`UNKNOWN`**: Places the system into safe hold when telemetry is missing, stale, or implausible.

---

## 2. System Architecture

```
[Raw Greywater]
       │
       ▼
[Sensors: DS18B20 Temp, TDS, Turbidity, (Optional pH)]
       │
       ▼
 [ESP32 IoT Controller] ──(WiFi REST Telemetry)──► [Node.js Express Backend]
       │ (Local Relay Switching)                                │
       ▼                                                        ▼
[Stage 1: Sediment Filter]                            [Deterministic Rules Engine]
       │                                                        │
       ▼                                                        ▼
[Stage 2: Carbon Bed]                                 [MySQL Persistent DB]
       │                                                        │
       ▼                                                        ▼
[Stage 3: Fine Module]                                [React 19 Vite PWA Dashboard]
       │
       ▼
[Non-Potable Reuse Application]
```

### Decoupled Data Provider
The dashboard operates with a **Single Data Provider** interface supporting two modes:
1. **`SIMULATED`**: Operates completely out-of-the-box before hardware is available, running 10 reproducible evaluation scenarios.
2. **`HARDWARE`**: Ingests real-time ESP32 telemetry via authenticated REST API (`POST /api/v1/telemetry`).
Both modes execute the identical validation and classification logic.

---

## 3. Getting Started

### Prerequisites
- Node.js (v18+) & npm (v9+)
- (Optional) MySQL Server 8.0+

### Quick Run (Zero-Config Demo)

1. **Install Dependencies:**
   ```bash
   npm --prefix backend install
   npm --prefix frontend install
   ```

2. **Start Backend Server:**
   ```bash
   npm --prefix backend run dev
   ```
   *Runs on `http://localhost:5000`*. If MySQL is offline or unconfigured, the backend automatically uses its built-in in-memory repository with zero disruption.

3. **Start Frontend Dashboard:**
   ```bash
   npm --prefix frontend run dev
   ```
   *Opens on `http://localhost:3000`*.

4. **Run Automated Tests:**
   ```bash
   npm --prefix backend run test
   ```
   *Executes all 17 unit and integration tests (100% pass rate).*

5. **Build Production PWA:**
   ```bash
   npm --prefix frontend run build
   ```

---

## 4. Database Setup (MySQL 8.0)

To persist sensor readings and system events permanently in MySQL:

1. Create the database and tables using the provided schema script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
2. Create your `.env` in the `backend/` folder (or copy from `.env.example`):
   ```ini
   PORT=5000
   DEVICE_API_KEY=gw-esp32-secret-2026
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=greywater_guardian
   ```
3. Restart the backend. You will see:
   ```
   [DB] Successfully connected to MySQL database 'greywater_guardian' on localhost:3306
   ```

---

## 5. Demo Evaluation Scenarios

The dashboard includes a dedicated scenario picker testing all required edge cases:

1. **Low Treatment Requirement (Basic):** Clean wash-basin water (TDS 180 ppm, Turbidity 3.2 NTU). Stage 1 active.
2. **Medium Treatment Requirement (Moderate):** Shower water with moderate soap (TDS 460 ppm, Turbidity 14.8 NTU). Stages 1 & 2 active.
3. **High Treatment Requirement (Intensive):** Laundry greywater with surfactants (TDS 940 ppm, Turbidity 38.5 NTU). Stages 1, 2 & 3 active.
4. **Missing pH Sensor (Prototype Setup):** Matches the student wiring diagram where the pH probe was omitted/crossed out. System processes TDS, Turbidity & Temp cleanly without error.
5. **Sensor Failure (Implausible Reading):** Broken probe reporting -45 ppm TDS. Flags `SENSOR_ERROR / UNKNOWN`; lowest treatment is NOT assumed.
6. **Stale Readings (Timed Out):** Simulates telemetry older than 45 seconds. Flags `STALE_DATA / UNKNOWN`.
7. **Device Offline:** Simulates disconnected ESP32. Displays offline status badge.
8. **Treatment Stage Error (Mismatch):** Rules engine recommends Stage 2, but hardware reports Stage 2 Relay Fault. Displays stage discrepancy warning banner.
9. **Post-Treatment Reading Available:** Dual-sensor setup displaying side-by-side effluent purification efficacy (% TDS & Turbidity removed).
10. **Post-Treatment Reading Unavailable:** Transparently notes that output probes are omitted on this prototype.

---

## 6. Hardware Integration (Delivered ESP32)

### Pin Mapping (Matches Student Diagram)
- **DS18B20 Temperature Sensor:** `GPIO 4` (1-Wire digital with 4.7kΩ pull-up)
- **Analog TDS Sensor:** `GPIO 34` (ADC1 Channel 6)
- **Analog Turbidity Sensor:** `GPIO 35` (ADC1 Channel 7)
- **Relay 1 (Pump):** `GPIO 25` (Active Low)
- **Relay 2 (Stage 2 Carbon Valve):** `GPIO 26` (Active Low)
- **Relay 3 (Stage 3 Fine Valve):** `GPIO 27` (Provisional)
- **pH Probe:** *Unassigned / Optional*

### Flashing the Microcontroller
1. Open [`esp32_greywater_guardian.ino`](file:///d:/evs%20project/esp32_greywater_guardian.ino) in Arduino IDE.
2. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_URL`.
3. Select board `ESP32 Dev Module` and click **Upload**.
4. The ESP32 will automatically transmit JSON telemetry every 3 seconds to `POST /api/v1/telemetry`.

---

## 7. Hardware Dependencies Awaiting Confirmation

Per Section 2 and Section 12, the following hardware details are explicitly pending with the external project shop:
1. **Pump Specifications:** Final voltage (12V DC submersible vs 5V) and flow rate (L/min).
2. **Stage 3 Module:** Whether physical cartridge will be ultrafiltration or ceramic microfiltration.
3. **pH Sensor Probe:** Scratched out on student diagram; treated as optional.
4. **Secondary Post-Treatment Sensors:** Dual-probe set for effluent verification pending shop confirmation.

---

## 8. Environmental & Health Safety Notice

> [!WARNING]
> Water assessed and treated by this system is strictly intended for **controlled non-potable domestic reuse** (toilet flushing, sub-surface landscape irrigation, outdoor pavement washing). Turbidity, TDS, and pH do not verify microbiological safety. Treated water must **NEVER** be consumed, used for cooking, or used for bathing.
