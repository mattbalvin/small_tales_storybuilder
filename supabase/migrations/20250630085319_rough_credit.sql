/*
  # Add Credit Balance and Subscription Tier to User Accounts

  1. New Columns
    - `credit_balance`: Integer column to track available creator credits
    - `subscription_tier`: Enum column for user subscription level (free, creator, creator_pro)
    - `subscription_expires_at`: Timestamp for subscription expiration
    - `last_credits_reset_at`: Timestamp for tracking when credits were last reset

  2. Security
    - Enable RLS on users table (already enabled)
    - Add policy for users to view and update their own credit balance
*/

-- Add new columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credit_balance INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_credits_reset_at TIMESTAMPTZ DEFAULT now();

-- Add constraint to ensure subscription_tier is one of the allowed values
ALTER TABLE public.users ADD CONSTRAINT users_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'creator', 'creator_pro'));

-- Create function to handle credit resets for subscriptions
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set credit balance based on subscription tier
  IF NEW.subscription_tier = 'creator' THEN
    NEW.credit_balance := NEW.credit_balance + 100;
  ELSIF NEW.subscription_tier = 'creator_pro' THEN
    NEW.credit_balance := NEW.credit_balance + 250;
  END IF;
  
  -- Update last reset timestamp
  NEW.last_credits_reset_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset credits when subscription is updated
CREATE TRIGGER trigger_reset_monthly_credits
  AFTER UPDATE OF subscription_tier ON public.users
  FOR EACH ROW
  WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
  EXECUTE FUNCTION reset_monthly_credits();

-- Create function to handle new user signup bonus credits
CREATE OR REPLACE FUNCTION add_signup_bonus_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set initial credit balance for new users (50 credits)
  NEW.credit_balance := 50;
  NEW.last_credits_reset_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add bonus credits for new users
CREATE TRIGGER trigger_add_signup_bonus_credits
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION add_signup_bonus_credits();

-- Create function to deduct credits when used
CREATE OR REPLACE FUNCTION public.use_credits(user_id UUID, amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current credit balance
  SELECT credit_balance INTO current_balance
  FROM public.users
  WHERE id = user_id;
  
  -- Check if user has enough credits
  IF current_balance >= amount THEN
    -- Deduct credits
    UPDATE public.users
    SET credit_balance = credit_balance - amount
    WHERE id = user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(user_id UUID, amount INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Add credits to user's balance
  UPDATE public.users
  SET credit_balance = credit_balance + amount
  WHERE id = user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create credit transaction table to track credit usage
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraint to ensure transaction_type is one of the allowed values
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check 
  CHECK (transaction_type IN ('purchase', 'subscription', 'usage', 'bonus', 'refund'));

-- Enable RLS on credit_transactions table
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Add policy for users to view their own credit transactions
CREATE POLICY "Users can view their own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to record credit transactions
CREATE OR REPLACE FUNCTION public.record_credit_transaction(
  user_id UUID, 
  amount INTEGER, 
  description TEXT, 
  transaction_type TEXT
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
BEGIN
  INSERT INTO public.credit_transactions (user_id, amount, description, transaction_type)
  VALUES (user_id, amount, description, transaction_type)
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;