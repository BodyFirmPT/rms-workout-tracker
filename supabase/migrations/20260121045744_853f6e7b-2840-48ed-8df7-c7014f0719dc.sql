-- Add is_paid column to track subscription status
ALTER TABLE public.users ADD COLUMN is_paid boolean NOT NULL DEFAULT false;

-- Add stripe_customer_id to link users to Stripe customers
ALTER TABLE public.users ADD COLUMN stripe_customer_id text;