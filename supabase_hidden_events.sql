-- Table pour stocker les événements suggérés masqués par l'utilisateur
CREATE TABLE IF NOT EXISTS hidden_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL, -- Identifiant unique de l'événement (ex: "noel-2025-12-25", "fete-des-meres-2025-05-25")
  hidden_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_key)
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_hidden_events_user_id ON hidden_events(user_id);

-- RLS (Row Level Security)
ALTER TABLE hidden_events ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs ne peuvent voir/modifier que leurs propres événements masqués
CREATE POLICY "Users can view own hidden events" ON hidden_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hidden events" ON hidden_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hidden events" ON hidden_events
  FOR DELETE USING (auth.uid() = user_id);
