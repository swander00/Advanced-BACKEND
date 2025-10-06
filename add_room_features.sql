-- ===============================================================
-- ADD NEW ROOM FEATURE COLUMNS TO PROPERTYROOMS TABLE
-- ===============================================================
-- This script adds three new room feature columns to the PropertyRooms table
-- These columns will store additional room feature information from the RESO feed
-- ===============================================================

-- Add the three new room feature columns
ALTER TABLE "PropertyRooms" 
ADD COLUMN "RoomFeature1" TEXT,
ADD COLUMN "RoomFeature2" TEXT,
ADD COLUMN "RoomFeature3" TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN "PropertyRooms"."RoomFeature1" IS 'Room Feature 1 - String (List, Single)';
COMMENT ON COLUMN "PropertyRooms"."RoomFeature2" IS 'Room Feature 2 - String (List, Single)';
COMMENT ON COLUMN "PropertyRooms"."RoomFeature3" IS 'Room Feature 3 - String (List, Single)';

-- ===============================================================
-- VERIFICATION QUERIES
-- ===============================================================
-- Run these to verify the new columns were added successfully

-- Check if the new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'PropertyRooms' 
  AND column_name IN ('RoomFeature1', 'RoomFeature2', 'RoomFeature3')
ORDER BY column_name;

-- Show the complete PropertyRooms table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'PropertyRooms' 
ORDER BY ordinal_position;

-- ===============================================================
-- NOTES
-- ===============================================================
-- ✅ The new columns are added as TEXT type to match RESO feed format
-- ✅ All columns are nullable to handle cases where features are not provided
-- ✅ No default values are set, allowing NULL for missing data
-- ✅ The columns follow the same naming convention as existing fields
-- ✅ Comments are added to document the purpose and expected format
