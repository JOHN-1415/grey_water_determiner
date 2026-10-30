# GreyWater Guardian — ESP32 Hardware Integration Guide

**Document Version:** 1.0.0  
**Target Delivery Review:** 2 November 2026  
**Hardware Reference:** Derived directly from student circuit diagram

---

## 1. Physical Architecture & Wiring Schematic

The system uses an **ESP32 microcontroller** as the primary IoT edge controller, gathering analog and digital sensor telemetry and controlling routing relays for domestic greywater filtration.

```
                   +---------------------+
                   |   5V / 12V Power    |
                   |      Supply         |
                   +----------+----------+
                              |
                              v
                   +---------------------+
  +----------------|        ESP32        |<---------------+
  | (OneWire)      |     Controller      |   (Analog ADC) |
  v                +----------+----------+                v
+---------------+             |                     +------------+
|    DS18B20    |             | (GPIO 25 Only)      | TDS Sensor |
|  Temp Sensor  |             v                     +------------+
+---------------+      +--------------+                   ^
                       | Pump Relay   |                   | (Analog ADC)
                       +-------+------+             +------------+
                               |                    | Turbidity  |
                               v                    |   Sensor   |
                       +--------------+             +------------+
                       | Submersible  |                   x
                       |  Pump (Stg 1)|         [pH Sensor Omitted]
                       +--------------+         (Crossed Out on Diagram)
```

### Verified Pin Allocation Table

| Component | Pin / Channel | ESP32 GPIO | Operating Voltage | Interface Type | Physical Status |
|---|---|---|---|---|---|
| **DS18B20** Temperature | DQ Data Pin | **GPIO 4** | 3.3V / 5.0V | 1-Wire Digital (requires 4.7kΩ pull-up to 3.3V) | **INSTALLED** |
| **Analog TDS Sensor** | Signal Out | **GPIO 34** | 3.3V – 5.0V | ADC1 Channel 6 (0–3.3V analog input) | **INSTALLED** |
| **Turbidity Sensor** | Signal Out (AOUT) | **GPIO 35** | 5.0V supply | ADC1 Channel 7 (0–3.3V analog input) | **INSTALLED** |
| **Pump Relay** | IN1 (Active Low) | **GPIO 25** | 5.0V VCC / 3.3V logic | Digital Output | **INSTALLED (Stage 1 Only)** |
| **Stage 2 Valve Relay** | None | *None* | *None* | Software classification only | **NOT INSTALLED** |
| **Stage 3 Valve Relay** | None | *None* | *None* | Software classification only | **NOT INSTALLED** |
| **pH Sensor** | Signal Out | *Unassigned* | *N/A* | Optional / Null | **OMITTED** |

> **IMPORTANT ARCHITECTURAL REALITY:**  
> The physical prototype implements **only ONE basic physical filtration stage** (Stage 1, pump driven by GPIO 25).  
> Medium and High are **software assessment classifications only** indicating whether the greywater quality exceeds basic capability. No physical Stage 2 or Stage 3 systems exist.

---

## 2. Telemetry Interfaces

The system supports two complementary telemetry modes:

### Primary: USB Serial Telemetry (115200 baud)
The ESP32 transmits newline-delimited JSON directly over USB Serial to the host computer:
```json
{"device_id":"GW-001","sequence":1,"temperature_c":27.5,"tds_ppm":420.0,"turbidity_ntu":12.4,"classification":"MEDIUM","pump_status":"ON","source_mode":"HARDWARE"}
```
- When the DS18B20 is disconnected, `"temperature_c":null` is emitted (never fabricated).
- When sensor readings are invalid, `null` is emitted and classification evaluates to `"UNKNOWN"`.
- Handled automatically by the Node.js Serial Collector: `npm --prefix backend run serial`.

### Secondary: Wi-Fi REST Telemetry (Optional)
Disabled by default (`ENABLE_WIFI = false`). Can be enabled in firmware if standalone wireless HTTP streaming to `POST /api/v1/telemetry` is desired.
| **Relay Actuation** | **CONFIRMED** | Mapped to Stage 1, Stage 2, and Pump power status in telemetry. |
| **pH Sensor Inclusion** | **PENDING / OPTIONAL** | Software treats `ph` as nullable (`null`). When omitted, assessment proceeds reliably without false alarms. |
| **Stage 3 Fine Module** | **PENDING SHOP STOCK** | Marked provisional in pipeline visualizer; activates only when hardware reports status. |
| **Post-Treatment Probes** | **PENDING** | Software handles both Scenario 9 (output verified) and Scenario 10 (output omitted) seamlessly. |
| **Pump Voltage & Model** | **PENDING** | Local relay control handled entirely by ESP32 firmware; no remote motor PWM required. |

---

## 3. Step-by-Step Firmware Flashing Guide

### Prerequisites
1. **Arduino IDE** (v2.x) or **PlatformIO** (VS Code).
2. Install **ESP32 Board Package** via Boards Manager (`esp32 by Espressif Systems`).
3. Install required libraries via Library Manager:
   - `DallasTemperature` by Miles Burton
   - `OneWire` by Paul Stoffregen
   - `ArduinoJson` (v6 or v7)

### Flashing Steps
1. Open [`esp32_greywater_guardian.ino`](file:///d:/evs%20project/esp32_greywater_guardian.ino) in Arduino IDE.
2. Update the network credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverUrl = "http://192.168.1.100:5000/api/v1/telemetry"; // Local IP of server machine
   ```
3. Select Board: **ESP32 Dev Module**.
4. Set Flash Frequency: **80MHz**, Upload Speed: **921600**.
5. Connect ESP32 via Micro-USB, select the COM port, and click **Upload**.
6. Open Serial Monitor at **115200 baud** to verify WiFi connection and HTTP POST responses.

---

## 4. Troubleshooting Hardware Communication

1. **Telemetry Returns 401 Unauthorized:**
   - Verify that your sketch sends `http.addHeader("X-API-Key", "gw-esp32-secret-2026");`.
2. **Readings Displayed as Stale on Dashboard:**
   - The dashboard flags telemetry as `STALE_DATA` if more than 30 seconds elapse without a packet. Ensure `delay(3000)` in `loop()` is operating without network blocking.
3. **Sensor Reading Out of Range / Error:**
   - Ensure analog sensor ground wires are connected to ESP32 `GND` (common ground). Floating grounds will cause implausible ADC readings.
