-- Remove preferred_length (content length is now dynamic per prompt)
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_length;
