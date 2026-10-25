/*
 * ==============================================================================
 * GreyWater Guardian — ESP32 Adaptive Greywater Filtration Firmware
 * ==============================================================================
 * Project: GreyWater Guardian
 * Review Date: 2 November 2026
 *
 * Circuit Diagram Pin Mapping:
 * - DS18B20 Temp Sensor:  GPIO 4 (1-Wire digital bus with 4.7k pull-up to 3.3V)
 * - Analog TDS Sensor:    GPIO 34 (ADC1 Channel 6)
 * - Analog Turbidity:     GPIO 35 (ADC1 Channel 7)
 * - Pump Relay:           GPIO 25 (Active Low Relay Channel 1)
 * - Stage 2 Carbon Relay: GPIO 26 (Active Low Relay Channel 2)
 * - Stage 3 Fine Relay:   GPIO 27 (Provisional)
 * - pH Sensor:            OPTIONAL (Omitted / crossed out on diagram)
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// --- Configuration ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "http://192.168.1.100:5000/api/v1/telemetry"; // Change to your backend host IP
const char* API_KEY       = "gw-esp32-secret-2026";
const char* DEVICE_ID     = "GW-001";

// --- Pin Definitions ---
#define PIN_DS18B20        4
#define PIN_TDS_ADC        34
#define PIN_TURBIDITY_ADC  35
#define PIN_RELAY_PUMP     25
#define PIN_RELAY_STAGE2   26
#define PIN_RELAY_STAGE3   27

// --- Objects & State ---
OneWire oneWire(PIN_DS18B20);
DallasTemperature tempSensors(&oneWire);

unsigned long sequenceNumber = 1;
unsigned long lastTelemetryMillis = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 3000; // Telemetry cycle every 3 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[BOOT] Starting GreyWater Guardian ESP32 Controller...");

  // Relay initialization (Active LOW relays - HIGH means OFF)
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  pinMode(PIN_RELAY_STAGE2, OUTPUT);
  pinMode(PIN_RELAY_STAGE3, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP, HIGH);
  digitalWrite(PIN_RELAY_STAGE2, HIGH);
  digitalWrite(PIN_RELAY_STAGE3, HIGH);

  // Initialize Sensors
  tempSensors.begin();
  analogReadResolution(12); // ESP32 12-bit ADC (0–4095)

  // WiFi Connection
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Connection pending/retrying in background.");
  }
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = currentMillis;

    // 1. Read DS18B20 Temperature
    tempSensors.requestTemperatures();
    float tempC = tempSensors.getTempCByIndex(0);
    if (tempC < -50.0) tempC = 25.0; // Sensor disconnected fallback

    // 2. Read TDS Sensor
    int rawTds = analogRead(PIN_TDS_ADC);
    float tdsVoltage = rawTds * (3.3 / 4095.0);
    float tdsPpm = (133.42 * pow(tdsVoltage, 3) - 255.86 * pow(tdsVoltage, 2) + 857.39 * tdsVoltage) * 0.5;
    if (tdsPpm < 0) tdsPpm = 0;

    // 3. Read Turbidity Sensor
    int rawTurb = analogRead(PIN_TURBIDITY_ADC);
    float turbVoltage = rawTurb * (3.3 / 4095.0);
    float turbidityNtu = -1120.4 * pow(turbVoltage, 2) + 5742.3 * turbVoltage - 4353.8;
    if (turbidityNtu < 0) turbidityNtu = 0;

    // 4. Local Adaptive Stage Routing Logic
    int activeStage = 1;
    if (turbidityNtu > 25.0 || tdsPpm > 800.0) {
      activeStage = 3; // Stage 3 Fine Module
      digitalWrite(PIN_RELAY_STAGE2, LOW); // Stage 2 Active
      digitalWrite(PIN_RELAY_STAGE3, LOW); // Stage 3 Active
    } else if (turbidityNtu > 5.0 || tdsPpm > 300.0) {
      activeStage = 2; // Stage 2 Carbon Bed
      digitalWrite(PIN_RELAY_STAGE2, LOW); // Stage 2 Active
      digitalWrite(PIN_RELAY_STAGE3, HIGH); // Stage 3 Bypassed
    } else {
      activeStage = 1; // Basic physical sediment
      digitalWrite(PIN_RELAY_STAGE2, HIGH);
      digitalWrite(PIN_RELAY_STAGE3, HIGH);
    }
    digitalWrite(PIN_RELAY_PUMP, LOW); // Pump ON

    // 5. Send Telemetry HTTP POST
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", API_KEY);

      // JSON Telemetry Payload
      String payload = "{";
      payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
      payload += "\"sequence\":" + String(sequenceNumber++) + ",";
      payload += "\"uptime_seconds\":" + String(currentMillis / 1000) + ",";
      payload += "\"source_mode\":\"HARDWARE\",";
      payload += "\"device_status\":\"ONLINE\",";
      payload += "\"sensors\":{";
      payload += "\"ph\":null,"; // Optional pH probe omitted per prototype wiring diagram
      payload += "\"tds_ppm\":" + String(tdsPpm, 1) + ",";
      payload += "\"turbidity_ntu\":" + String(turbidityNtu, 1) + ",";
      payload += "\"temperature_c\":" + String(tempC, 1);
      payload += "},";
      payload += "\"treatment\":{";
      payload += "\"active_stage\":" + String(activeStage) + ",";
      payload += "\"stage_1\":\"ACTIVE\",";
      payload += "\"stage_2\":\"" + String(activeStage >= 2 ? "ACTIVE" : "BYPASSED") + "\",";
      payload += "\"stage_3\":\"" + String(activeStage >= 3 ? "ACTIVE" : "BYPASSED") + "\",";
      payload += "\"pump_status\":\"ON\"";
      payload += "}}";

      int httpResponseCode = http.POST(payload);
      if (httpResponseCode > 0) {
        Serial.printf("[HTTP] Telemetry POST sent (#%lu) -> Response: %d\n", sequenceNumber - 1, httpResponseCode);
      } else {
        Serial.printf("[HTTP] Telemetry failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    }
  }
}
