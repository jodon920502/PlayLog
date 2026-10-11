ALTER TABLE profiles
  ALTER COLUMN display_name TYPE varchar(30);

ALTER TABLE profiles
  ADD CONSTRAINT profiles_display_name_rules
  CHECK (
    char_length(display_name) BETWEEN 1 AND 30
    AND display_name !~ '[[:space:]]'
  );
