-- Script feedback: stores user feedback on generated scripts for rule extraction
-- Links to auth.users and optionally to scripts

CREATE TABLE IF NOT EXISTS public.script_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  script_snapshot TEXT,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing by user
CREATE INDEX IF NOT EXISTS script_feedback_user_id_idx ON public.script_feedback (user_id, created_at DESC);

-- RLS
ALTER TABLE public.script_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.script_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.script_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);
