-- Add favorite_color for personalized background
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_color TEXT;
