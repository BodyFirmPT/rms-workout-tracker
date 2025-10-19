-- Add canceledAt column to workout table
ALTER TABLE workout ADD COLUMN canceled_at timestamp with time zone;