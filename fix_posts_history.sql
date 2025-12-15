CREATE TABLE IF NOT EXISTS posts_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  business_id UUID,
  image_url TEXT,
  text_content TEXT,
  description TEXT,
  platform VARCHAR(50),
  tone VARCHAR(50),
  style VARCHAR(50),
  scheduled_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE posts_history ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE posts_history ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

ALTER TABLE posts_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own posts" ON posts_history;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts_history;
DROP POLICY IF EXISTS "Users can update own posts" ON posts_history;

CREATE POLICY "Users can view own posts" ON posts_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts_history FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE events ADD COLUMN IF NOT EXISTS post_id UUID;
