-- Script complet pour corriger la table posts_history

-- D'abord, vérifions quelles colonnes existent déjà
-- Si la table existe avec des colonnes manquantes, on les ajoute

-- Ajouter les colonnes manquantes une par une (si elles n'existent pas)
DO $$
BEGIN
    -- Ajouter business_id si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'business_id') THEN
        ALTER TABLE posts_history ADD COLUMN business_id UUID;
    END IF;

    -- Ajouter image_url si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'image_url') THEN
        ALTER TABLE posts_history ADD COLUMN image_url TEXT;
    END IF;

    -- Ajouter text_content si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'text_content') THEN
        ALTER TABLE posts_history ADD COLUMN text_content TEXT;
    END IF;

    -- Ajouter description si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'description') THEN
        ALTER TABLE posts_history ADD COLUMN description TEXT;
    END IF;

    -- Ajouter platform si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'platform') THEN
        ALTER TABLE posts_history ADD COLUMN platform VARCHAR(50);
    END IF;

    -- Ajouter tone si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'tone') THEN
        ALTER TABLE posts_history ADD COLUMN tone VARCHAR(50);
    END IF;

    -- Ajouter style si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'style') THEN
        ALTER TABLE posts_history ADD COLUMN style VARCHAR(50);
    END IF;

    -- Ajouter scheduled_date si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'scheduled_date') THEN
        ALTER TABLE posts_history ADD COLUMN scheduled_date DATE;
    END IF;

    -- Ajouter status si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts_history' AND column_name = 'status') THEN
        ALTER TABLE posts_history ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
    END IF;
END $$;

-- S'assurer que RLS est activé
ALTER TABLE posts_history ENABLE ROW LEVEL SECURITY;

-- Supprimer et recréer les policies
DROP POLICY IF EXISTS "Users can view own posts" ON posts_history;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts_history;
DROP POLICY IF EXISTS "Users can update own posts" ON posts_history;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts_history;

CREATE POLICY "Users can view own posts" ON posts_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts_history
    FOR DELETE USING (auth.uid() = user_id);

-- Ajouter post_id à events si manquant
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'post_id') THEN
        ALTER TABLE events ADD COLUMN post_id UUID;
    END IF;
END $$;
