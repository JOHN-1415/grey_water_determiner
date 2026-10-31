-- Migration 002: Transition to IoT Assessment & Treatment Recommendation System
-- Preserves existing historical records while adding new classification and recommendation columns

USE greywater_guardian;

-- 1. Add new columns if not present
ALTER TABLE sensor_readings
ADD COLUMN IF NOT EXISTS sensor_validity JSON NULL AFTER ph,
ADD COLUMN IF NOT EXISTS assigned_classification VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN' AFTER sensor_validity,
ADD COLUMN IF NOT EXISTS recommendation_details JSON NULL AFTER assigned_classification;

-- 2. Migrate existing historical records: map legacy recommended_treatment_level to assigned_classification
UPDATE sensor_readings
SET assigned_classification = CASE 
    WHEN recommended_treatment_level = 'BASIC' THEN 'LEVEL_1'
    WHEN recommended_treatment_level = 'MEDIUM' THEN 'LEVEL_2'
    WHEN recommended_treatment_level = 'HIGH' THEN 'LEVEL_3'
    ELSE 'UNKNOWN'
END
WHERE assigned_classification = 'UNKNOWN' AND recommended_treatment_level IS NOT NULL;

-- 3. Add index on assigned_classification for fast querying
ALTER TABLE sensor_readings
ADD INDEX IF NOT EXISTS idx_classification (assigned_classification);
