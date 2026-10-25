import React, { useState } from 'react';
import { X, Cpu, Copy, Check, Terminal, ExternalLink, AlertTriangle, Layers } from 'lucide-react';

export default function HardwareIntegrationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedArduino, setCopiedArduino] = useState(false);

  const curlCommand = `curl -X POST http://localhost:5000/api/v1/telemetry \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: gw-esp32-secret-2026" \\
  -d '{
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
    "treatment": {
      "active_stage": 2,
      "stage_1": "COMPLETED",
      "stage_2": "ACTIVE",
      "stage_3": "BYPASSED",
      "pump_status": "ON"
    }
  }'`;

  const arduinoSnippet = `// ============================================================
// GreyWater Guardian — ESP32 Telemetry & Adaptive Filtration Firmware
// Hardware Layout: Matches Student Block Diagram
// Sensors: DS18B20 (GPIO 4), TDS (GPIO 34), Turbidity (GPIO 35), Relay (GPIO 25)
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:5000/api/v1/telemetry";
const char* apiKey = "gw-esp32-secret-2026";
const char* deviceId = "GW-001";

#define ONE_WIRE_BUS 4       // DS18B20 digital pin
#define TDS_PIN 34           // Analog TDS sensor pin
#define TURBIDITY_PIN 35     // Analog Turbidity sensor pin
#define RELAY_PUMP_PIN 25    // Relay controlling pump
#define RELAY_STAGE2_PIN 26  // Relay routing through Carbon Bed

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature dsSensors(&oneWire);
unsigned long sequence = 1;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  pinMode(RELAY_STAGE2_PIN, OUTPUT);
  digitalWrite(RELAY_PUMP_PIN, HIGH); // Off initially (Active Low)

  dsSensors.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    dsSensors.requestTemperatures();
    float tempC = dsSensors.getTempCByIndex(0);

    // Read TDS (Calibrated analog formula)
    int tdsRaw = analogRead(TDS_PIN);
    float tdsVoltage = tdsRaw * (3.3 / 4095.0);
    float tdsPpm = (133.42 * pow(tdsVoltage, 3) - 255.86 * pow(tdsVoltage, 2) + 857.39 * tdsVoltage) * 0.5;

    // Read Turbidity
    int turbRaw = analogRead(TURBIDITY_PIN);
    float turbVoltage = turbRaw * (3.3 / 4095.0);
    float turbidityNtu = -1120.4 * pow(turbVoltage, 2) + 5742.3 * turbVoltage - 4353.8;
    if (turbidityNtu < 0) turbidityNtu = 0;

    // Local Adaptive Stage Decision
    int activeStage = 1;
    if (tdsPpm > 300 || turbidityNtu > 5.0) {
      activeStage = 2; // Activate Stage 2 Carbon relay
      digitalWrite(RELAY_STAGE2_PIN, LOW);
    } else {
      digitalWrite(RELAY_STAGE2_PIN, HIGH);
    }
    digitalWrite(RELAY_PUMP_PIN, LOW); // Pump ON

    // Build JSON Telemetry Payload
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);

    String payload = "{";
    payload += "\\"device_id\\":\\"" + String(deviceId) + "\\",";
    payload += "\\"sequence\\":" + String(sequence++) + ",";
    payload += "\\"uptime_seconds\\":" + String(millis() / 1000) + ",";
    payload += "\\"source_mode\\":\\"HARDWARE\\",";
    payload += "\\"device_status\\":\\"ONLINE\\",";
    payload += "\\"sensors\\":{";
    payload += "\\"ph\\":null,"; // pH probe omitted per prototype diagram
    payload += "\\"tds_ppm\\":" + String(tdsPpm, 1) + ",";
    payload += "\\"turbidity_ntu\\":" + String(turbidityNtu, 1) + ",";
    payload += "\\"temperature_c\\":" + String(tempC, 1);
    payload += "},";
    payload += "\\"treatment\\":{";
    payload += "\\"active_stage\\":" + String(activeStage) + ",";
    payload += "\\"stage_1\\":\\"ACTIVE\\",";
    payload += "\\"stage_2\\":\\"" + String(activeStage >= 2 ? "ACTIVE" : "BYPASSED") + "\\",";
    payload += "\\"stage_3\\":\\"BYPASSED\\",";
    payload += "\\"pump_status\\":\\"ON\\"";
    payload += "}}";

    int httpCode = http.POST(payload);
    Serial.printf("Telemetry POST result: %d\\n", httpCode);
    http.end();
  }
  delay(3000); // 3 second telemetry cycle
}`;

  const copyToClipboard = (text, setFn) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '840px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc' }}>
                ESP32 Hardware Integration Contract
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Handwritten circuit diagram mapping, API contract, and firmware sketch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. Hardware Status Checklist */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#38bdf8', marginBottom: '10px' }}>
            Hardware Component Confirmation Matrix (Per Student Circuit Diagram)
          </h4>
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>COMPONENT</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>INTERFACE PIN</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>STATUS</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>NOTES</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '6px 8px', fontWeight: '600' }}>DS18B20 Temp Sensor</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>GPIO 4 (OneWire)</td>
                <td style={{ padding: '6px 8px' }}><span className="badge level-basic">CONFIRMED</span></td>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>Digital bus with 4.7k pull-up resistor</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '6px 8px', fontWeight: '600' }}>Analog TDS Sensor</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>GPIO 34 (ADC1_CH6)</td>
                <td style={{ padding: '6px 8px' }}><span className="badge level-basic">CONFIRMED</span></td>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>Measures dissolved solids 0–1000 ppm</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '6px 8px', fontWeight: '600' }}>Turbidity Sensor</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>GPIO 35 (ADC1_CH7)</td>
                <td style={{ padding: '6px 8px' }}><span className="badge level-basic">CONFIRMED</span></td>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>Photodiode transmission voltage</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '6px 8px', fontWeight: '600' }}>Relay Module (Pump/Valves)</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>GPIO 25, 26</td>
                <td style={{ padding: '6px 8px' }}><span className="badge level-basic">CONFIRMED</span></td>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>Switches 12V submersible pump and solenoids</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '6px 8px', fontWeight: '600' }}>pH Sensor Probe</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>N/A (Crossed Out)</td>
                <td style={{ padding: '6px 8px' }}><span className="badge level-unknown">OPTIONAL / PENDING</span></td>
                <td style={{ padding: '6px 8px', color: '#fbbf24' }}>Explicitly marked optional in code; probe crossed out on diagram</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: '600' }}>Stage 3 Microfiltration</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>GPIO 27</td>
                <td style={{ padding: '6px 8px' }}><span className="badge level-unknown">PENDING SHOP CONFIRM</span></td>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>External project shop awaiting module stock</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Sample cURL Test Command */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={16} color="#38bdf8" />
              Test Telemetry Ingestion via cURL
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(curlCommand, setCopiedCurl)}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              {copiedCurl ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              {copiedCurl ? 'Copied!' : 'Copy cURL'}
            </button>
          </div>
          <pre style={{
            background: '#090d16',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: '#38bdf8',
            overflowX: 'auto',
            border: '1px solid var(--border-subtle)'
          }}>
            {curlCommand}
          </pre>
        </div>

        {/* 3. ESP32 Arduino Sketch Code */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={16} color="#34d399" />
              Arduino ESP32 C++ Sketch (Flash to Microcontroller)
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(arduinoSnippet, setCopiedArduino)}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              {copiedArduino ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              {copiedArduino ? 'Copied!' : 'Copy Sketch'}
            </button>
          </div>
          <pre style={{
            background: '#090d16',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.725rem',
            fontFamily: 'var(--font-mono)',
            color: '#a7f3d0',
            maxHeight: '220px',
            overflowY: 'auto',
            border: '1px solid var(--border-subtle)'
          }}>
            {arduinoSnippet}
          </pre>
        </div>

      </div>
    </div>
  );
}
