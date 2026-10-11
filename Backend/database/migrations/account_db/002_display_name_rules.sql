ALTER TABLE users
  ALTER COLUMN username TYPE varchar(30);

ALTER TABLE users
  ADD CONSTRAINT users_username_display_name_rules
  CHECK (
    char_length(username) BETWEEN 1 AND 30
    AND username !~ '[[:space:]]'
  );
