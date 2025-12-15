-- Ajouter la clé étrangère pour lier events à posts_history
ALTER TABLE events
ADD CONSTRAINT fk_events_post
FOREIGN KEY (post_id)
REFERENCES posts_history(id)
ON DELETE SET NULL;
