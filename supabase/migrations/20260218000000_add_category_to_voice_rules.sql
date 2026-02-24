-- Add category column to voice_rules to distinguish communication/style rules
-- from expertise/knowledge/perspective rules sourced from YouTube extraction.
--
-- voice     = tone, style, phrasing, delivery directives (from feedback)
-- expertise = knowledge facts, perspectives, communication styles learned from
--             expert sources (from ExpertisePage YouTube extraction)

ALTER TABLE voice_rules
  ADD COLUMN category TEXT NOT NULL DEFAULT 'voice'
  CHECK (category IN ('voice', 'expertise'));

-- Index for filtering by category within a user's rules
CREATE INDEX idx_voice_rules_user_category ON voice_rules(user_id, category);
