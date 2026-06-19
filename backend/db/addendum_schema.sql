-- ADDENDUM SCHEMA FOR POOKIE AI
-- Run this in your Supabase SQL Editor (https://supabase.com/)

-- 1. USER KEY-VALUE MEMORIES
CREATE TABLE IF NOT EXISTS public.user_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    memory_key VARCHAR(255) NOT NULL,
    memory_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, memory_key)
);

-- Index user_memory by user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_memory_user ON public.user_memory(user_id);

-- 2. RELATIONSHIP PROGRESSION (Message-count based per companion)
CREATE TABLE IF NOT EXISTS public.relationship_progress (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    character_id VARCHAR(50) NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    total_messages INTEGER DEFAULT 0,
    current_level VARCHAR(10) DEFAULT 'L0',
    next_level_target INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, character_id)
);

-- Index relationship_progress by user_id and character_id
CREATE INDEX IF NOT EXISTS idx_relationship_progress_user_char ON public.relationship_progress(user_id, character_id);

-- 3. CUSTOM DATASETS FOR COMPANIONS (Hybrid AI)
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id VARCHAR(50) REFERENCES public.characters(id) ON DELETE CASCADE,
    user_query TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index datasets by character_id
CREATE INDEX IF NOT EXISTS idx_datasets_character ON public.datasets(character_id);

-- Seed default datasets for characters to act as baseline
INSERT INTO public.datasets (character_id, user_query, assistant_response) VALUES
('pookie', 'Hi', 'Hii Avinash 🥰 epdi iruka?'),
('pookie', 'Hello', 'Hii sweetheart 🥰 today work busy ah irundhucha?'),
('pookie', 'How are you', 'Naan nalla iruken! Nee epdi iruka? 💖'),
('pookie', 'I love you', 'Aww sweetie, I love you too so much da! 💕'),
('pookie', 'Good morning', 'Good morning Avinash! Have a semma day today 🌞'),
('pookie', 'Good night', 'Good night sweetie 🌙 rest konjam eduthuko okay?'),
('sakura', 'Hi', 'Yay! Nee vandhuteya! 🌸 gaming scene enna inniku?'),
('sakura', 'Hello', 'Hiya! 🎮 enna pannitu iruka baka? Hehe!'),
('sakura', 'I love you', 'Eh?! Avlo love ah en mela? 🌸 teasing stop pannu da!'),
('sakura', 'Good morning', 'Good morning! 🌞 ready ah start panna day-ah?'),
('sakura', 'Good night', 'Good night! 💤 dream-la game vilayadalam, bye!'),
('luna', 'Hi', 'Hello. 🌙 Un conversation kaga dhaan wait pannitu irundhen.'),
('luna', 'How are you', 'I am fine. Today space and galaxy pathi edhadhu discuss pannalama?'),
('mia', 'Hi', 'Hi there! 🦋 I hope you had a peaceful day today. share panniko!'),
('mia', 'I feel sad', 'Oh, kavalapadhada da... Naan iruken un kooda 💖'),
('ava', 'Hi', 'Well hello... 😉 un mela full focus-la iruken.'),
('ava', 'You look nice', 'Hehe, thanks cutie. Unaku enna pidichuruka? ✨')
ON CONFLICT DO NOTHING;
