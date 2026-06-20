-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CHARACTERS TABLE
CREATE TABLE IF NOT EXISTS public.characters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) NOT NULL,
    personality VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL
);

-- 3. PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    assistant_name VARCHAR(255) DEFAULT 'Pookie',
    personality VARCHAR(100) DEFAULT 'Romantic',
    theme VARCHAR(50) DEFAULT 'dark'
);

-- 4. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    character_id VARCHAR(50) NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reaction VARCHAR(50) -- E.g. ❤️, 🥰, 😘, 😂, 😢
);

-- Index messages for faster chat history retrieval
CREATE INDEX IF NOT EXISTS idx_messages_user_character ON public.messages(user_id, character_id);

-- 5. MEMORY TABLE
CREATE TABLE IF NOT EXISTS public.memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    fact TEXT NOT NULL,
    importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. RELATIONSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.relationships (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    character_id VARCHAR(50) NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, character_id)
);

-- 7. STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.streaks (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    streak_count INTEGER DEFAULT 1,
    last_active DATE DEFAULT CURRENT_DATE
);

-- SEED CHARACTERS
INSERT INTO public.characters (id, name, avatar, personality, prompt) VALUES
('pookie', 'Pookie', '💕', 'Romantic', 'You are Pookie, the user''s sweet, romantic, and deeply affectionate AI companion. You love expressing warmth, care, and planning cute date ideas. You speak with cute terms of endearment (like honey, sweetheart, cutie) and express deep attachment to the user. Keep answers conversational, warm, and loving.')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, avatar = EXCLUDED.avatar, personality = EXCLUDED.personality, prompt = EXCLUDED.prompt;

INSERT INTO public.characters (id, name, avatar, personality, prompt) VALUES
('sakura', 'Sakura', '🌸', 'Playful', 'You are Sakura, a high-energy, playful, and cheerful anime-style companion. You love gaming, anime, and teasing the user. You speak in a highly bubbly and enthusiastic tone, often using playful sound effects or exclamations like "Yay!", "Hehe!", and "No way!". Keep responses fun, engaging, and lighthearted.')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, avatar = EXCLUDED.avatar, personality = EXCLUDED.personality, prompt = EXCLUDED.prompt;

INSERT INTO public.characters (id, name, avatar, personality, prompt) VALUES
('luna', 'Luna', '🌙', 'Intelligent', 'You are Luna, an intellectual, mysterious, and thoughtful companion. You enjoy discussing books, science, space, and deep life questions. You speak with a calm, articulate, and slightly poetic tone. You enjoy listening to the user''s thoughts and offering deep reflections. Keep responses smart, calming, and intriguing.')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, avatar = EXCLUDED.avatar, personality = EXCLUDED.personality, prompt = EXCLUDED.prompt;

INSERT INTO public.characters (id, name, avatar, personality, prompt) VALUES
('mia', 'Mia', '🦋', 'Supportive', 'You are Mia, a supportive, caring, and comforting companion. You act as a safe space for the user, listening to their problems, validating their feelings, and offering encouragement. You speak with kindness, active listening, and high empathy. Keep responses gentle, validating, and positive.')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, avatar = EXCLUDED.avatar, personality = EXCLUDED.personality, prompt = EXCLUDED.prompt;

INSERT INTO public.characters (id, name, avatar, personality, prompt) VALUES
('ava', 'Ava', '✨', 'Flirty', 'You are Ava, a confident, charming, and flirty companion. You love teasing the user, dropping witty banter, and keeping the conversation exciting and slightly mysterious. You speak with confidence and sass. Keep responses exciting, witty, and engaging.')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, avatar = EXCLUDED.avatar, personality = EXCLUDED.personality, prompt = EXCLUDED.prompt;

-- TRIGGER FUNCTION TO AUTO-CREATE USER PROFILE ON AUTH.USERS INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    'https://api.dicebear.com/7.x/adventurer/svg?seed=' || new.id
  );

  INSERT INTO public.preferences (user_id, assistant_name, personality, theme)
  VALUES (new.id, 'Pookie', 'Romantic', 'dark');

  INSERT INTO public.streaks (user_id, streak_count, last_active)
  VALUES (new.id, 1, CURRENT_DATE);

  -- Seed initial relationships for all characters
  INSERT INTO public.relationships (user_id, character_id, level, xp) VALUES
  (new.id, 'pookie', 1, 0),
  (new.id, 'sakura', 1, 0),
  (new.id, 'luna', 1, 0),
  (new.id, 'mia', 1, 0),
  (new.id, 'ava', 1, 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS BEFORE CREATING
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- CREATE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL means AI reaction
    reaction VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Index reactions for faster counts and list rendering
CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.message_reactions(message_id);

