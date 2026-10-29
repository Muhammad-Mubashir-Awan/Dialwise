-- The settings table always has exactly one row (id = 1), created here with the column defaults.
INSERT INTO "settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
