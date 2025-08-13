-- Migration: Add image_data column for base64 image storage fallback
-- Created: 2025-01-11
-- Purpose: Store base64 image data when Supabase storage upload fails

-- Add image_data column to store base64 encoded images as fallback
ALTER TABLE student_responses 
ADD COLUMN IF NOT EXISTS image_data TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN student_responses.image_data IS 'Base64 encoded image data (fallback when Supabase storage fails)';

-- Create index for better performance when querying large base64 data
CREATE INDEX IF NOT EXISTS idx_student_responses_image_data 
ON student_responses(image_data) 
WHERE image_data IS NOT NULL;
