-- Voice rules table: user-specific communication rules for AI context
-- Links to auth.users via user_id

CREATE TABLE IF NOT EXISTS voice_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'avoid', 'prefer', 'never', 'tone', 'style', 'delivery',
    'phrasing', 'speech_patterns', 'non_negotiables', 'general'
  )),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'feedback')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient user lookups
CREATE INDEX idx_voice_rules_user_id ON voice_rules(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE voice_rules ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rules
CREATE POLICY "Users can view own voice rules"
  ON voice_rules FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rules
CREATE POLICY "Users can insert own voice rules"
  ON voice_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rules
CREATE POLICY "Users can update own voice rules"
  ON voice_rules FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own rules
CREATE POLICY "Users can delete own voice rules"
  ON voice_rules FOR DELETE
  USING (auth.uid() = user_id);
