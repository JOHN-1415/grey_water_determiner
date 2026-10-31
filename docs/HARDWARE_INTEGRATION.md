# GreyWater Guardian — ESP32 Hardware Integration Guide
## IoT-Based Greywater Quality Assessment and Treatment Recommendation System

**Document Version:** 2.0.0  
**Target Delivery Review:** 2 November 2026  
**Hardware Reference:** Verified physical prototype & circuit diagram

---

## 1. Physical Architecture & System Overview

The project operates as an **IoT-based Greywater Quality Assessment and Treatment Recommendation System**. 
The physical filtration unit was never constructed; therefore, the system accurately monitors incoming water quality and provides analytical treatment recommendations without claiming that physical filtration is being performed.

```
                   +---------------------+
                   |   5V / 9V Power     |
                   |   Supply / Buck     |
                   +----------+----------+
                              |
                              v
                   +---------------------+
  +----------------|        ESP32        |<---------------+
  | (OneWire)      |     Dev Module      |   (Analog ADC) |
  v                +---------------------+                v
+---------------+             |                     +------------+
|    DS18B20    |             | (Unused / Idle)     | TDS Sensor |
|  Temp Sensor  |             v                     |  (GPIO 34) |
|   (GPIO 4)    |      +--------------+             +------------+
+---------------+      | 2-Ch Relay   |                   ^
                       | (Not Used)   |                   | (Analog ADC)
                       +--------------+             +------------+
                                                    | Turbidity  |
                                                    |  (GPIO 35) |
                                                    +------------+
                                                          x
                                                [pH Sensor Omitted]
                                                (Omitted from Diagram)
```

### Verified Pin Allocation Table

| Component | Pin / Channel | ESP32 GPIO | Operating Voltage | Interface Type | Physical Status |
|---|---|---|---|---|---|
| **DS18B20** Temperature | DQ Data Pin | **GPIO 4** | 3.3V / 5.0V | 1-Wire Digital (requires 4.7kΩ pull-up to 3.3V) | **INSTALLED** (Contextual) |
| **Analog TDS Sensor** | Signal Out | **GPIO 34** | 3.3V – 5.0V | ADC1 Channel 6 (0–3.3V analog input) | **INSTALLED** (Assessment) |
| **Turbidity Sensor** | Signal Out (AOUT) | **GPIO 35** | 5.0V supply | ADC1 Channel 7 (0–3.3V analog input) | **INSTALLED** (Assessment) |
| **2-Channel Relay Module** | IN1 / IN2 | *None* | 5.0V | Physically present but unassigned | **UNUSED / IDLE** |
| **pH Sensor** | Signal Out | *None* | *N/A* | Optional / Omitted | **NOT INSTALLED** |

> **IMPORTANT ARCHITECTURAL NOTICE:**  
> The physical prototype implements **only sensor data acquisition**.  
> No physical filtration unit or pump is connected or activated.  
> Classifications (`LEVEL_1`, `LEVEL_2`, `LEVEL_3`) and treatment pathways are **software analytical recommendations** suggesting what external treatment processes would be suitable for the water quality.

---

## 2. Telemetry Interfaces

The system supports two complementary telemetry modes:

### Primary: USB Serial Telemetry (115200 baud)
The ESP32 transmits newline-delimited JSON directly over USB Serial to the host computer every ~3 seconds:
```json
{"device_id":"GW-001","sequence":1,"temperature_c":27.5,"tds_ppm":420.0,"turbidity_ntu":12.4,"classification":"LEVEL_2","source_mode":"HARDWARE"}
```
- When the DS18B20 is disconnected, `"temperature_c":null` is emitted (never fabricated).
- When sensor readings are invalid, `null` is emitted and classification evaluates to `"UNKNOWN"`.
- Handled automatically by the Node.js Serial Collector: `npm --prefix backend run serial`.

### Secondary: Wi-Fi REST Telemetry (Optional)
Disabled by default (`ENABLE_WIFI = false`). Can be enabled in firmware if standalone wireless HTTP streaming to `POST /api/v1/telemetry` is desired.

---

## 3. Step-by-Step Firmware Uploading Guide

### Prerequisites
1. **Arduino IDE** (v2.x) or **PlatformIO**.
2. Install **ESP32 Board Package** via Boards Manager (`esp32 by Espressif Systems`).
3. Install required libraries:
   - `DallasTemperature` by Miles Burton
   - `OneWire` by Paul Stoffregen

### Flashing Steps
1. Open [`esp32_greywater_guardian/esp32_greywater_guardian.ino`](file:///d:/evs%20project/esp32_greywater_guardian/esp32_greywater_guardian.ino) in Arduino IDE.
2. Select Board: **ESP32 Dev Module**.
3. Select Port: **COM7** (or the detected Silicon Labs / CH340 COM port).
4. Click **Upload**.
5. Close the Arduino Serial Monitor so that the serial port is free for the Node.js backend.
