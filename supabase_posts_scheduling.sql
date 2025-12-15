-- Script SQL pour ajouter les fonctionnalités de planification de posts

-- 1. Ajouter les colonnes de planification à la table posts_history
ALTER TABLE posts_history
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- 2. Ajouter la colonne post_id à la table events pour lier les posts planifiés
ALTER TABLE events
ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts_history(id);

-- 3. Créer un index pour les posts planifiés
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_date ON posts_history(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- 4. Créer un index pour les événements liés aux posts
CREATE INDEX IF NOT EXISTS idx_events_post_id ON events(post_id) WHERE post_id IS NOT NULL;

-- 5. Vue pour les posts planifiés à venir
CREATE OR REPLACE VIEW upcoming_scheduled_posts AS
SELECT
  ph.id,
  ph.user_id,
  ph.image_url,
  ph.text_content,
  ph.description,
  ph.platform,
  ph.scheduled_date,
  ph.status,
  ph.created_at,
  b.business_name
FROM posts_history ph
JOIN businesses b ON ph.business_id = b.id
WHERE ph.scheduled_date >= CURRENT_DATE
  AND ph.status = 'scheduled'
ORDER BY ph.scheduled_date ASC;

-- 6. Fonction pour marquer un post comme publié
CREATE OR REPLACE FUNCTION mark_post_as_published(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts_history
  SET status = 'published'
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
