-- =============================================
-- Script SQL pour permettre les notifications sans event_id
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Supprimer la contrainte de clé étrangère existante
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_event_id_fkey;

-- Recréer la contrainte avec ON DELETE SET NULL pour permettre NULL
ALTER TABLE notifications
  ADD CONSTRAINT notifications_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES events(id)
  ON DELETE SET NULL;

-- Vérifier que la colonne event_id accepte NULL (devrait déjà être le cas)
ALTER TABLE notifications ALTER COLUMN event_id DROP NOT NULL;

-- Ajouter une politique pour permettre aux utilisateurs d'insérer leurs propres notifications
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
