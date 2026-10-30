/*
 * ==============================================================================
 * GreyWater Guardian — ESP32 Adaptive Greywater Filtration Firmware
 * ==============================================================================
 * Project: GreyWater Guardian
 * Review Date: 2 November 2026
 *
 * PHYSICAL PROTOTYPE WIRING (Verified):
 * - Microcontroller: ESP32 Dev Module
 * - DS18B20 Temp Sensor:   GPIO 4 (1-Wire digital bus with 4.7k pull-up to 3.3V)
 * - Analog TDS Sensor:     GPIO 34 (ADC1 Channel 6)
 * - Analog Turbidity:      GPIO 35 (ADC1 Channel 7)
 * - Pump Relay (Stage 1):  GPIO 25 (Active-LOW Songle 5V Relay Channel 1)
 *
 * NOTE ON FILTRATION ARCHITECTURE:
 * The physical prototype implements ONLY basic physical sediment filtration (Stage 1)
 * driven by the pump on GPIO 25.
 *
 * Classifications 'MEDIUM' and 'HIGH' are SOFTWARE ASSESSMENTS ONLY.
 * There are NO physical Stage 2 or Stage 3 relays, valves, or modules installed.
 * ==============================================================================
 */

#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- Device Configuration ---
const char* DEVICE_ID = "GW-001";
const unsigned long TELEMETRY_INTERVAL_MS = 3000; // ~3 seconds telemetry cycle

// --- Pin Definitions (Verified Physical Layout) ---
#define PIN_DS18B20        4
#define PIN_TDS_ADC        34
#define PIN_TURBIDITY_ADC  35
#define PIN_RELAY_PUMP     25  // Active-LOW relay for physical Stage 1 pump

// --- Configurable Water Quality Thresholds (Project Initial Baseline) ---
// Note: These are initial prototype assessment thresholds, not certified drinking standards.
const float THRESHOLD_TURBIDITY_BASIC_MAX  = 5.0;   // NTU (≤ 5.0 satisfies basic)
const float THRESHOLD_TURBIDITY_MEDIUM_MAX = 25.0;  // NTU (> 25.0 triggers HIGH)
const float THRESHOLD_TDS_BASIC_MAX        = 300.0; // ppm (≤ 300 satisfies basic)
const float THRESHOLD_TDS_MEDIUM_MAX       = 800.0; // ppm (> 800 triggers HIGH)

// --- Safe Pump Operating Parameters ---
// Prevents continuous indefinite running, dry-run motor burnout, and thermal hazards.
const unsigned long PUMP_MAX_CONTINUOUS_RUN_MS = 25000; // 25s max pump run per cycle
const unsigned long PUMP_MIN_REST_MS           = 10000; // 10s cooldown rest between runs
const float PUMP_MAX_SAFE_TEMP_C               = 55.0;  // Thermal safety cutoff (°C)

// --- Wi-Fi Configuration (Optional - Disabled by Default for USB Serial) ---
const bool ENABLE_WIFI = false; // Set to true only if local WiFi telemetry is desired
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "http://192.168.1.100:5000/api/v1/telemetry";
const char* API_KEY       = "gw-esp32-secret-2026";

// --- Hardware Objects & State ---
OneWire oneWire(PIN_DS18B20);
DallasTemperature tempSensors(&oneWire);

unsigned long sequenceNumber = 1;
unsigned long lastTelemetryMillis = 0;

// Safe pump state management
bool pumpActive = false;
unsigned long pumpStartTime = 0;
unsigned long lastPumpStopTime = 0;

/**
 * Sets the physical pump relay state safely (Active-LOW: LOW=ON, HIGH=OFF)
 */
void setPumpState(bool turnOn, const char* reason = "") {
  if (turnOn) {
    digitalWrite(PIN_RELAY_PUMP, LOW); // Energize relay -> Pump ON
    if (!pumpActive) {
      pumpStartTime = millis();
      pumpActive = true;
      Serial.printf("[DIAG] Pump Relay ON: %s (Max cycle: %lu s)\n", 
                    reason, PUMP_MAX_CONTINUOUS_RUN_MS / 1000);
    }
  } else {
    digitalWrite(PIN_RELAY_PUMP, HIGH); // De-energize relay -> Pump OFF
    if (pumpActive) {
      lastPumpStopTime = millis();
      pumpActive = false;
      Serial.printf("[DIAG] Pump Relay OFF: %s\n", reason);
    }
  }
}

/**
 * Calculates deterministic water-quality classification based on valid readings.
 * Classification is a software determination and does NOT activate nonexistent stages.
 */
String calculateClassification(bool tdsValid, float tdsPpm, bool turbValid, float turbidityNtu) {
  if (!tdsValid || !turbValid) {
    return "UNKNOWN";
  }

  // HIGH condition: Turbidity > 25 NTU OR TDS > 800 ppm
  if (turbidityNtu > THRESHOLD_TURBIDITY_MEDIUM_MAX || tdsPpm > THRESHOLD_TDS_MEDIUM_MAX) {
    return "HIGH";
  }

  // MEDIUM condition: Turbidity > 5 NTU OR TDS > 300 ppm (provided not HIGH)
  if (turbidityNtu > THRESHOLD_TURBIDITY_BASIC_MAX || tdsPpm > THRESHOLD_TDS_BASIC_MAX) {
    return "MEDIUM";
  }

  // BASIC condition: Turbidity <= 5 NTU AND TDS <= 300 ppm
  return "BASIC";
}

void setup() {
  // Initialize USB Serial at 115200 baud
  Serial.begin(115200);
  delay(500);

  Serial.println("[BOOT] Starting GreyWater Guardian ESP32 Controller...");
  Serial.println("[BOOT] Physical prototype: Stage 1 Basic Physical Filtration ONLY.");

  // Initialize Pump Relay pin on GPIO 25 (Start OFF - Active LOW)
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP, HIGH); // OFF initially
  pumpActive = false;
  lastPumpStopTime = millis();

  // Initialize 12-bit ADC for ESP32 (0–4095 range)
  analogReadResolution(12);

  // Initialize DS18B20 1-Wire temperature bus
  tempSensors.begin();
  tempSensors.setWaitForConversion(false); // Non-blocking temperature conversion

  // Optional Wi-Fi initialization (Non-blocking)
  if (ENABLE_WIFI) {
    Serial.printf("[DIAG] Attempting optional Wi-Fi connection to: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  } else {
    Serial.println("[BOOT] Wi-Fi disabled. Direct USB Serial communication active.");
  }

  Serial.println("[BOOT] Initialization complete. Streaming JSON telemetry over USB Serial.\n");
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Pump Safety Management & Duty-Cycle Enforcement
  if (pumpActive) {
    // Check continuous run timeout
    if (currentMillis - pumpStartTime >= PUMP_MAX_CONTINUOUS_RUN_MS) {
      setPumpState(false, "Continuous run timeout reached - entering rest period");
    }
  }

  // 2. Periodic Telemetry Interval (~3000 ms)
  if (currentMillis - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = currentMillis;

    // --- SENSOR ACQUISITION ---

    // A. Temperature Acquisition (DS18B20 on GPIO 4)
    tempSensors.requestTemperatures();
    float tempC = tempSensors.getTempCByIndex(0);
    bool tempValid = true;

    // Do NOT substitute 25.0°C when disconnected!
    // DallasTemperature returns DEVICE_DISCONNECTED_C (-127.0°C) or 85.0°C on power glitch.
    if (tempC <= -127.0 || tempC < -20.0 || tempC > 100.0) {
      tempValid = false;
    }

    // B. TDS Acquisition (GPIO 34)
    int rawTds = analogRead(PIN_TDS_ADC);
    float tdsVoltage = rawTds * (3.3 / 4095.0);
    // Standard quadratic calibration formula
    float tdsPpm = (133.42 * pow(tdsVoltage, 3) - 255.86 * pow(tdsVoltage, 2) + 857.39 * tdsVoltage) * 0.5;
    bool tdsValid = true;

    if (rawTds < 0 || rawTds > 4095) {
      tdsValid = false;
    } else if (tdsPpm < 0.0) {
      tdsPpm = 0.0; // Floor for clean water
    }

    // C. Turbidity Acquisition (GPIO 35)
    int rawTurb = analogRead(PIN_TURBIDITY_ADC);
    float turbVoltage = rawTurb * (3.3 / 4095.0);
    // Standard turbidity transmission voltage formula
    float turbidityNtu = -1120.4 * pow(turbVoltage, 2) + 5742.3 * turbVoltage - 4353.8;
    bool turbValid = true;

    if (rawTurb < 0 || rawTurb > 4095) {
      turbValid = false;
    } else if (turbidityNtu < 0.0) {
      turbidityNtu = 0.0; // Clear water reading floor
    }

    // --- WATER QUALITY CLASSIFICATION ---
    String classification = calculateClassification(tdsValid, tdsPpm, turbValid, turbidityNtu);

    // --- SAFE PUMP CONTROL EVALUATION ---
    // Thermal Emergency Cutoff
    if (tempValid && tempC > PUMP_MAX_SAFE_TEMP_C) {
      if (pumpActive) {
        setPumpState(false, "Emergency thermal cutoff (Water temp > 55°C)");
      }
    } else if (classification == "UNKNOWN") {
      // Sensor error: do not operate pump on invalid or missing telemetry
      if (pumpActive) {
        setPumpState(false, "Sensors invalid / UNKNOWN classification - safe hold");
      }
    } else {
      // Safe operation: if pump is off and cooldown elapsed, activate Stage 1 filtration
      if (!pumpActive && (currentMillis - lastPumpStopTime >= PUMP_MIN_REST_MS)) {
        setPumpState(true, "Initiating scheduled Stage 1 basic physical filtration");
      }
    }

    // Reflect actual hardware relay state
    const char* pumpStatusStr = pumpActive ? "ON" : "OFF";

    // --- JSON TELEMETRY EMISSION OVER USB SERIAL ---
    // Exactly ONE valid JSON object per line, ending with '\n'.
    // Diagnostic messages are printed separately with [DIAG] / [BOOT] prefix.
    String jsonRecord = "{";
    jsonRecord += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    jsonRecord += "\"sequence\":" + String(sequenceNumber++) + ",";

    // Temperature (null if probe disconnected)
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
    jsonRecord += "\"pump_status\":\"" + String(pumpStatusStr) + "\",";
    jsonRecord += "\"source_mode\":\"HARDWARE\"";
    jsonRecord += "}";

    // Transmit JSON over USB Serial
    Serial.println(jsonRecord);

    // --- OPTIONAL WI-FI HTTP TRANSMISSION ---
    if (ENABLE_WIFI && WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", API_KEY);
      http.POST(jsonRecord);
      http.end();
    }
  }
}
