-- GreyWater Guardian Database Schema
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS greywater_guardian;
USE greywater_guardian;

-- 1. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(64) NOT NULL PRIMARY KEY,
    device_name VARCHAR(128) NOT NULL,
    api_key_hash VARCHAR(128) NULL,
    last_seen_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Sensor Readings Table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    received_at DATETIME NOT NULL,
    sequence INT NOT NULL,
    ph DECIMAL(4, 2) NULL,
    tds_ppm DECIMAL(8, 2) NULL,
    turbidity_ntu DECIMAL(8, 2) NULL,
    temperature_c DECIMAL(5, 2) NULL,
    device_status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    source_mode VARCHAR(32) NOT NULL DEFAULT 'HARDWARE',
    assessment_status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    recommended_treatment_level VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    active_stage INT NULL,
    pump_status VARCHAR(32) NULL,
    output_ph DECIMAL(4, 2) NULL,
    output_tds_ppm DECIMAL(8, 2) NULL,
    output_turbidity_ntu DECIMAL(8, 2) NULL,
    output_temperature_c DECIMAL(5, 2) NULL,
    raw_payload JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_received (device_id, received_at DESC),
    INDEX idx_sequence (device_id, sequence),
    CONSTRAINT fk_readings_device FOREIGN KEY (device_id) 
        REFERENCES devices (device_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. System Events Table
CREATE TABLE IF NOT EXISTS system_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'INFO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_events (device_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Initial Seed for Primary Prototype Device
INSERT INTO devices (device_id, device_name, last_seen_at)
VALUES ('GW-001', 'ESP32 Main Greywater Monitor', NOW())
ON DUPLICATE KEY UPDATE device_name = VALUES(device_name);
