-- =============================================
-- Script SQL pour le système de Templates AiNa
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- 1. Créer la table des templates
CREATE TABLE IF NOT EXISTS post_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  -- Infos du template
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'promotion', 'nouveau_produit', 'evenement', 'quotidien', 'autre'

  -- Contenu du template
  image_url TEXT,
  text_content TEXT,
  description TEXT, -- Description utilisée pour générer

  -- Paramètres de génération
  platform VARCHAR(50),
  tone VARCHAR(50),
  style VARCHAR(50),
  image_style VARCHAR(50), -- 'photo_realiste', 'illustration', etc.

  -- Métadonnées
  use_count INTEGER DEFAULT 0, -- Nombre de fois utilisé
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON post_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_business_id ON post_templates(business_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON post_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_favorite ON post_templates(is_favorite);

-- 3. RLS (Row Level Security)
ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs ne voient que leurs templates
CREATE POLICY "Users can view own templates" ON post_templates
  FOR SELECT USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent créer leurs templates
CREATE POLICY "Users can create own templates" ON post_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent modifier leurs templates
CREATE POLICY "Users can update own templates" ON post_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent supprimer leurs templates
CREATE POLICY "Users can delete own templates" ON post_templates
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Fonction pour incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_template_use(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE post_templates
  SET use_count = use_count + 1,
      updated_at = NOW()
  WHERE id = template_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour toggle favori
CREATE OR REPLACE FUNCTION toggle_template_favorite(template_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  new_status BOOLEAN;
BEGIN
  UPDATE post_templates
  SET is_favorite = NOT is_favorite,
      updated_at = NOW()
  WHERE id = template_id AND user_id = auth.uid()
  RETURNING is_favorite INTO new_status;

  RETURN new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
