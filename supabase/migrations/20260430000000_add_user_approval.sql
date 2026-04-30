-- Add is_approved column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Update existing users to be approved so they aren't locked out
UPDATE public.profiles SET is_approved = true WHERE is_approved IS NULL OR is_approved = false;

-- Ensure new users are NOT approved by default (setting it again just to be explicit)
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT false;

-- Add notification type for user approval
INSERT INTO public.email_notification_settings (notification_type, enabled, description)
VALUES ('user_approved', true, 'Sent to users when their account is approved by an admin')
ON CONFLICT (notification_type) DO NOTHING;
