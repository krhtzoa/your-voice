-- Scripts table: stores generated scripts per user
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  prompt TEXT,
  platform TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scripts_user_id_created_at_idx ON public.scripts (user_id, created_at DESC);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scripts"
  ON public.scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts"
  ON public.scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON public.scripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON public.scripts FOR DELETE
  USING (auth.uid() = user_id);
