-- Add first_name, last_name, and other_name to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS other_name TEXT;

-- Create a function to auto-generate full_name from the parts
CREATE OR REPLACE FUNCTION generate_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Construct full_name from first_name, other_name, and last_name
  NEW.full_name := TRIM(
    CONCAT_WS(' ',
      NEW.first_name,
      NEW.other_name,
      NEW.last_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update full_name when name parts change
DROP TRIGGER IF EXISTS generate_full_name_trigger ON profiles;
CREATE TRIGGER generate_full_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name, other_name
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_full_name();

-- Migrate existing full_name data to first_name and last_name
-- This is a one-time migration for existing records
UPDATE profiles
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' THEN 
      SPLIT_PART(full_name, ' ', 1)
    ELSE NULL
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 THEN 
      SPLIT_PART(full_name, ' ', ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1))
    ELSE NULL
  END,
  other_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 2 THEN 
      ARRAY_TO_STRING(
        (STRING_TO_ARRAY(full_name, ' '))[2:ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1)-1],
        ' '
      )
    ELSE NULL
  END
WHERE first_name IS NULL AND full_name IS NOT NULL;

