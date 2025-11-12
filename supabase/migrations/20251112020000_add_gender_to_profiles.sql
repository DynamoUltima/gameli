-- Add gender column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add comment to explain the column
COMMENT ON COLUMN profiles.gender IS 'User gender: male, female, other, or prefer_not_to_say';

