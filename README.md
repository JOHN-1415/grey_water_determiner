# GreyWater Guardian — IoT Greywater Quality Assessment & Recommendation System

[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blue.svg)](https://vite.dev)
[![React 19](https://img.shields.io/badge/React-19.3-cyan.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/Database-MySQL%20%7C%20In--Memory-orange.svg)](https://mysql.com)
[![Tests Passing](https://img.shields.io/badge/Tests-22%20Passed-brightgreen.svg)]()

> **Target Review Date:** 2 November 2026  
> **Course / Field:** Environmental Science / Water Conservation & IoT Engineering  
> **Application Type:** Progressive Web Application (PWA) + Node.js REST Backend + ESP32 Telemetry

---

## 1. Project Overview

Domestic greywater generated from wash basins, showers, and laundry often gets discharged without reuse, despite significant portions being recyclable for non-potable domestic tasks (toilet flushing, subsurface landscape irrigation, floor cleaning, vehicle rinsing).

**GreyWater Guardian** is an IoT-based water-quality monitoring, analysis, and treatment recommendation system. Using an ESP32 microcontroller with analog TDS, optical Turbidity, and digital DS18B20 Temperature sensors, the system continuously evaluates incoming greywater quality characteristics and determines appropriate treatment recommendations:
- **`LEVEL_1` (Basic Recommendation)**: Turbidity $\le$ 5.0 NTU and TDS $\le$ 300 ppm. Simple physical screening and sedimentation settling are suggested before non-potable reuse.
- **`LEVEL_2` (Moderate Recommendation)**: Turbidity $>$ 5.0 NTU or TDS $>$ 300 ppm. Physical filtration combined with Activated Carbon adsorption is suggested.
- **`LEVEL_3` (Advanced Recommendation)**: Turbidity $>$ 25.0 NTU or TDS $>$ 800 ppm. Multi-barrier coagulation, fine microfiltration/UF membrane, and carbon polishing are advised.
- **`UNKNOWN` (Safe Hold)**: Missing, disconnected, or implausible sensor data. The system enters a safe hold and never assumes the lowest treatment level.

> **IMPORTANT ARCHITECTURAL NOTICE:**  
> The physical prototype implements sensor data acquisition only. No physical filtration unit or pump is connected. The classifications and treatment stages are analytical software recommendations guiding external treatment procedures.

---

## 2. System Architecture

```
[Raw Greywater Sample]
       │
       ▼
[Sensors: DS18B20 Temp (GPIO 4), Analog TDS (GPIO 34), Turbidity (GPIO 35)]
       │
       ▼
 [ESP32 IoT Controller] ──(115200 Baud Serial / REST)──► [Node.js Express Backend]
                                                                  │
                                                                  ▼
                                                      [Deterministic Rules Engine]
                                                                  │
                                                                  ▼
                                                      [MySQL / In-Memory Store]
                                                                  │
                                                                  ▼
                                                      [React 19 Vite PWA Dashboard]
                                                                  │
                                                                  ▼
                                                      [Downloadable Assessment Reports]
```

### Verified Hardware Connections
- **Microcontroller**: ESP32 Dev Module (30-pin)
- **DS18B20 Digital Temperature**: GPIO 4 (1-Wire digital bus with 4.7kΩ pull-up)
- **Analog TDS Sensor**: GPIO 34 (ADC1 Channel 6)
- **Analog Turbidity Sensor**: GPIO 35 (ADC1 Channel 7)
- **2-Channel Relay Module**: Physically present on prototype board but unassigned and inactive
- **pH Sensor**: Omitted / uninstalled (handled as null)

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

2. **Start Backend Server & Serial Collector:**
   ```bash
   npm --prefix backend run dev
   ```
   *Runs on `http://localhost:5000`*. If MySQL is offline or unconfigured, the backend automatically uses its built-in in-memory repository with zero disruption.

3. **Start Frontend PWA:**
   ```bash
   npm --prefix frontend run dev
   ```
   *Opens on `http://localhost:3000`*.

4. **Run Automated Test Suite:**
   ```bash
   npm test
   ```
   *Executes all 22 backend unit and integration tests.*

---

## 4. Scientific & Regulatory Limitations

The installed sensors measure selected physical and chemical indicators (turbidity, TDS, and temperature).
1. **Sensor Scope**: Heavy metals, chemical toxins, BOD, COD, and pathogens are not measured.
2. **No Potability Certification**: This system does NOT evaluate drinking water safety or certify water for human consumption.
3. **No Microbiological Safety Confirmation**: Turbidity and TDS sensors cannot detect viruses, coliforms, or pathogens.
4. **Informational Guidance Only**: The prototype does not physically purify water; recommendations are informational and do not guarantee statutory non-potable reuse compliance.
