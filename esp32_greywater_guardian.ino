/*
 * ==============================================================================
 * GreyWater Guardian — ESP32 Greywater Quality Assessment System Firmware
 * ==============================================================================
 * Project: GreyWater Guardian
 * Review Date: 2 November 2026
 *
 * PHYSICAL SENSOR WIRING (Verified):
 * - Microcontroller: ESP32 Dev Module
 * - DS18B20 Temp Sensor:   GPIO 4 (1-Wire digital bus with 4.7k pull-up to 3.3V)
 * - Analog TDS Sensor:     GPIO 34 (ADC1 Channel 6)
 * - Analog Turbidity:      GPIO 35 (ADC1 Channel 7)
 *
 * IMPORTANT HARDWARE ARCHITECTURE NOTICE:
 * - The physical prototype is an IoT SENSING & WATER-QUALITY ASSESSMENT SYSTEM ONLY.
 * - No physical filtration unit or pump is connected or operated.
 * - Relay module channels (GPIO 25, 26, 27) are completely UNASSIGNED and NOT ACTIVATED.
 * - Classifications (LEVEL_1, LEVEL_2, LEVEL_3) are software-based analytical
 *   recommendations for suggested external treatment; no treatment is physically performed.
 * ==============================================================================
 */

#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- Device Configuration ---
const char* DEVICE_ID = "GW-001";
const unsigned long TELEMETRY_INTERVAL_MS = 3000; // ~3 seconds telemetry cycle

// --- Pin Definitions (Verified Physical Sensor Layout Only) ---
#define PIN_DS18B20        4   // Digital 1-Wire Temperature Bus
#define PIN_TDS_ADC        34  // Analog TDS Input (ADC1_CH6)
#define PIN_TURBIDITY_ADC  35  // Analog Turbidity Input (ADC1_CH7)
// NOTE: GPIO 25, 26, 27 relays are obsolete and intentionally omitted.

// --- Configurable Water Quality Thresholds (Prototype Assessment Criteria) ---
// Note: These criteria require laboratory validation and do not certify drinking water standards.
const float THRESHOLD_TURBIDITY_LEVEL1_MAX = 5.0;   // NTU (<= 5.0 satisfies Level 1)
const float THRESHOLD_TURBIDITY_LEVEL2_MAX = 25.0;  // NTU (> 25.0 triggers Level 3)
const float THRESHOLD_TDS_LEVEL1_MAX       = 300.0; // ppm (<= 300 satisfies Level 1)
const float THRESHOLD_TDS_LEVEL2_MAX       = 800.0; // ppm (> 800 triggers Level 3)

// --- Wi-Fi Configuration (Enabled for Laptop Hotspot Telemetry) ---
const bool ENABLE_WIFI = true; // Wi-Fi telemetry active with USB Serial fallback
const char* WIFI_SSID     = "Robots";
const char* WIFI_PASSWORD = "12345678";
const char* SERVER_URL    = "http://192.168.137.1:5000/api/v1/telemetry";
const char* API_KEY       = "gw-esp32-secret-2026";

// --- Hardware Objects & State ---
OneWire oneWire(PIN_DS18B20);
DallasTemperature tempSensors(&oneWire);

unsigned long sequenceNumber = 1;
unsigned long lastTelemetryMillis = 0;

/**
 * Calculates deterministic water-quality assessment classification based on sensor readings.
 * Classifications:
 * - LEVEL_1: Basic treatment recommendation (TDS <= 300 ppm AND Turbidity <= 5.0 NTU)
 * - LEVEL_2: Moderate treatment recommendation (TDS > 300 ppm OR Turbidity > 5.0 NTU, below Level 3)
 * - LEVEL_3: Advanced treatment recommendation (TDS > 800 ppm OR Turbidity > 25.0 NTU)
 * - UNKNOWN: Missing or invalid sensor readings
 *
 * Temperature is treated as contextual metadata and does not alter the level.
 */
String calculateClassification(bool tdsValid, float tdsPpm, bool turbValid, float turbidityNtu) {
  if (!tdsValid || !turbValid) {
    return "UNKNOWN";
  }

  // Level 3 (Advanced): Turbidity > 25 NTU OR TDS > 800 ppm
  if (turbidityNtu > THRESHOLD_TURBIDITY_LEVEL2_MAX || tdsPpm > THRESHOLD_TDS_LEVEL2_MAX) {
    return "LEVEL_3";
  }

  // Level 2 (Moderate): Turbidity > 5 NTU OR TDS > 300 ppm
  if (turbidityNtu > THRESHOLD_TURBIDITY_LEVEL1_MAX || tdsPpm > THRESHOLD_TDS_LEVEL1_MAX) {
    return "LEVEL_2";
  }

  // Level 1 (Basic): Turbidity <= 5 NTU AND TDS <= 300 ppm
  return "LEVEL_1";
}

void setup() {
  // Initialize USB Serial at 115200 baud
  Serial.begin(115200);
  delay(500);

  Serial.println("[BOOT] Starting GreyWater Guardian — Water Quality Assessment System...");
  Serial.println("[BOOT] Sensor-Only Mode: DS18B20 (GPIO 4), TDS (GPIO 34), Turbidity (GPIO 35).");
  Serial.println("[BOOT] Note: No physical filtration or pump relays are activated.");

  // Initialize 12-bit ADC for ESP32 (0–4095 range)
  analogReadResolution(12);

  // Initialize DS18B20 1-Wire temperature bus
  tempSensors.begin();
  tempSensors.setWaitForConversion(false); // Non-blocking temperature conversion

  // Wi-Fi initialization (Non-blocking)
  if (ENABLE_WIFI) {
    Serial.printf("[BOOT] Initializing Wi-Fi connection to SSID: %s...\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  } else {
    Serial.println("[BOOT] Wi-Fi disabled. Direct USB Serial communication active at 115200 baud.");
  }

  Serial.println("[BOOT] Setup complete. Streaming sensor assessment JSON records over USB Serial and Wi-Fi.\n");
}

void loop() {
  unsigned long currentMillis = millis();

  // Non-blocking Wi-Fi auto-reconnect check (every 10 seconds if disconnected)
  static unsigned long lastWifiCheck = 0;
  if (ENABLE_WIFI && WiFi.status() != WL_CONNECTED && (currentMillis - lastWifiCheck >= 10000)) {
    lastWifiCheck = currentMillis;
    Serial.println("[DIAG] Wi-Fi not connected. Attempting background reconnect to hotspot...");
    WiFi.reconnect();
  }

  // Periodic Telemetry Interval (~3000 ms)
  if (currentMillis - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = currentMillis;

    // --- SENSOR ACQUISITION ---

    // 1. Temperature Acquisition (DS18B20 on GPIO 4 - Non-blocking, Non-dependent)
    // Removed as a mandatory dependency. Failure or disconnection never interrupts TDS or Turbidity.
    float tempC = -127.0;
    bool tempValid = false;

    // Only attempt conversion if 1-Wire device is physically present on bus
    if (tempSensors.getDeviceCount() > 0) {
      tempSensors.requestTemperatures();
      tempC = tempSensors.getTempCByIndex(0);
      // Validate: Dallas chips output -127.0°C on disconnect and 85.0°C on uncompleted power-on reset
      if (tempC > -20.0 && tempC < 85.0 && tempC != -127.0) {
        tempValid = true;
      }
    }

    // 2. TDS Acquisition (GPIO 34)
    int rawTds = analogRead(PIN_TDS_ADC);
    float tdsVoltage = rawTds * (3.3 / 4095.0);
    // Quadratic calibration curve for gravity analog TDS sensor
    float tdsPpm = (133.42 * pow(tdsVoltage, 3) - 255.86 * pow(tdsVoltage, 2) + 857.39 * tdsVoltage) * 0.5;
    bool tdsValid = true;

    if (rawTds < 0 || rawTds > 4095) {
      tdsValid = false;
    } else if (tdsPpm < 0.0) {
      tdsPpm = 0.0; // Floor for clean water
    }

    // 3. Turbidity Acquisition (GPIO 35)
    int rawTurb = analogRead(PIN_TURBIDITY_ADC);
    float turbVoltage = rawTurb * (3.3 / 4095.0);
    // Calibration formula for optical turbidity sensor
    float turbidityNtu = -1120.4 * pow(turbVoltage, 2) + 5742.3 * turbVoltage - 4353.8;
    bool turbValid = true;

    if (rawTurb < 0 || rawTurb > 4095) {
      turbValid = false;
    } else if (turbidityNtu < 0.0) {
      turbidityNtu = 0.0; // Floor for clear water
    }

    // --- WATER QUALITY CLASSIFICATION ---
    // Deterministic classification derived strictly from TDS and Turbidity
    String classification = calculateClassification(tdsValid, tdsPpm, turbValid, turbidityNtu);

    // --- JSON TELEMETRY EMISSION OVER USB SERIAL ---
    // Exactly ONE valid JSON object per line, ending with '\n'.
    String jsonRecord = "{";
    jsonRecord += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    jsonRecord += "\"sequence\":" + String(sequenceNumber++) + ",";

    // Temperature (null if probe disconnected or unavailable; do not fabricate)
    jsonRecord += "\"temperature_c\":";
    if (tempValid) {
      jsonRecord += String(tempC, 1) + ",";
    } else {
      jsonRecord += "null,";
    }

    // TDS (null if sensor invalid)
    jsonRecord += "\"tds_ppm\":";
    if (tdsValid) {
      jsonRecord += String(tdsPpm, 1) + ",";
    } else {
      jsonRecord += "null,";
    }

    // Turbidity (null if sensor invalid)
    jsonRecord += "\"turbidity_ntu\":";
    if (turbValid) {
      jsonRecord += String(turbidityNtu, 1) + ",";
    } else {
      jsonRecord += "null,";
    }

    jsonRecord += "\"classification\":\"" + classification + "\",";
    jsonRecord += "\"source_mode\":\"HARDWARE\"";
    jsonRecord += "}";

    // Primary / Fallback Output: Stream JSON over USB Serial at 115200 baud
    Serial.println(jsonRecord);

    // Optional Wi-Fi HTTP POST Telemetry (Non-blocking with 1.5s timeout)
    if (ENABLE_WIFI && WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.setTimeout(1500); // 1.5 second network timeout prevents loop stalling
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", API_KEY);
      int httpResponseCode = http.POST(jsonRecord);
      if (httpResponseCode <= 0) {
        // Log diagnostic warning to Serial without disrupting JSON streaming
        Serial.printf("[DIAG] Wi-Fi HTTP POST error code: %d\n", httpResponseCode);
      }
      http.end();
    }
  }
}
