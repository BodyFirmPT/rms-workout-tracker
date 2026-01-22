-- Add subscription_override column to users table
-- NULL = use normal Stripe logic
-- true = force Pro status
-- false = force Free status
ALTER TABLE public.users 
ADD COLUMN subscription_override boolean DEFAULT NULL;