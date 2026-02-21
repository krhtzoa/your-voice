-- Add speaking speed (words per minute) for audio/podcast/video content
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS speaking_speed_wpm INTEGER DEFAULT 145;
