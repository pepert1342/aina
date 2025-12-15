-- =============================================
-- Script SQL pour le système de notifications AiNa
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- 1. Créer la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'reminder_7_days', 'reminder_2_days'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- 3. RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs ne voient que leurs notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Politique: le système peut insérer des notifications (via service_role)
CREATE POLICY "Service can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Politique: les utilisateurs peuvent mettre à jour leurs notifications (marquer comme lu)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Fonction pour créer automatiquement les notifications quand un événement est créé
CREATE OR REPLACE FUNCTION create_event_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification J-7 (7 jours avant)
  INSERT INTO notifications (user_id, event_id, type, title, message, scheduled_for)
  VALUES (
    NEW.user_id,
    NEW.id,
    'reminder_7_days',
    '📅 Rappel: ' || NEW.title || ' dans 7 jours',
    'Votre événement "' || NEW.title || '" est prévu dans 7 jours. C''est le moment idéal pour préparer votre post !',
    NEW.event_date - INTERVAL '7 days'
  );

  -- Notification J-2 (2 jours avant)
  INSERT INTO notifications (user_id, event_id, type, title, message, scheduled_for)
  VALUES (
    NEW.user_id,
    NEW.id,
    'reminder_2_days',
    '⏰ Rappel urgent: ' || NEW.title || ' dans 2 jours',
    'Votre événement "' || NEW.title || '" arrive dans 2 jours ! N''oubliez pas de finaliser et publier votre post.',
    NEW.event_date - INTERVAL '2 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger pour créer les notifications automatiquement
DROP TRIGGER IF EXISTS trigger_create_event_notifications ON events;
CREATE TRIGGER trigger_create_event_notifications
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_notifications();

-- 6. Fonction pour supprimer les notifications quand un événement est supprimé
CREATE OR REPLACE FUNCTION delete_event_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications WHERE event_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger pour supprimer les notifications
DROP TRIGGER IF EXISTS trigger_delete_event_notifications ON events;
CREATE TRIGGER trigger_delete_event_notifications
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION delete_event_notifications();

-- 8. Vue pour obtenir les notifications actives (prêtes à être affichées)
CREATE OR REPLACE VIEW active_notifications AS
SELECT
  n.*,
  e.title as event_title,
  e.event_date,
  e.event_type as event_type_detail
FROM notifications n
LEFT JOIN events e ON n.event_id = e.id
WHERE n.scheduled_for <= NOW()
  AND n.read_at IS NULL
ORDER BY n.scheduled_for DESC;

-- 9. Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read_at = NOW()
  WHERE user_id = auth.uid() AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Pour les événements existants, créer les notifications rétroactivement
-- =============================================
INSERT INTO notifications (user_id, event_id, type, title, message, scheduled_for)
SELECT
  e.user_id,
  e.id,
  'reminder_7_days',
  '📅 Rappel: ' || e.title || ' dans 7 jours',
  'Votre événement "' || e.title || '" est prévu dans 7 jours. C''est le moment idéal pour préparer votre post !',
  e.event_date - INTERVAL '7 days'
FROM events e
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.event_id = e.id AND n.type = 'reminder_7_days'
)
AND e.event_date > NOW();

INSERT INTO notifications (user_id, event_id, type, title, message, scheduled_for)
SELECT
  e.user_id,
  e.id,
  'reminder_2_days',
  '⏰ Rappel urgent: ' || e.title || ' dans 2 jours',
  'Votre événement "' || e.title || '" arrive dans 2 jours ! N''oubliez pas de finaliser et publier votre post.',
  e.event_date - INTERVAL '2 days'
FROM events e
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.event_id = e.id AND n.type = 'reminder_2_days'
)
AND e.event_date > NOW();
