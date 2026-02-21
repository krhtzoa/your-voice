-- Add onboarding fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_existing_creator BOOLEAN,
  ADD COLUMN IF NOT EXISTS content_platforms JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
