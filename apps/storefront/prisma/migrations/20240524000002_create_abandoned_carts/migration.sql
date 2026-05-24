-- Abandoned cart tracking for recovery email reminders
CREATE TABLE IF NOT EXISTS "abandoned_carts" (
    "id"                      SERIAL PRIMARY KEY,
    "user_email"              TEXT NOT NULL,
    "user_name"               TEXT,
    "cart_data"               JSONB NOT NULL DEFAULT '[]',
    "completed_at"            TIMESTAMP(3),
    "first_reminder_sent_at"  TIMESTAMP(3),
    "second_reminder_sent_at" TIMESTAMP(3),
    "updated_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Partial unique index: one active (non-completed) cart per email
CREATE UNIQUE INDEX IF NOT EXISTS "abandoned_carts_user_email_active"
    ON "abandoned_carts" ("user_email")
    WHERE "completed_at" IS NULL;

CREATE INDEX IF NOT EXISTS "abandoned_carts_reminder_idx"
    ON "abandoned_carts" ("completed_at", "first_reminder_sent_at", "second_reminder_sent_at", "updated_at");
