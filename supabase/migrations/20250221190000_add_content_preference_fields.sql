-- Content preference fields for personalized script generation (all nullable - user can skip)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS audience_knowledge_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS desired_feeling TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_background TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tone_style TEXT;
-- Tracks onboarding progress (next card index to show; 0-11)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
