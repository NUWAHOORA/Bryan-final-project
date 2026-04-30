-- 1. Create the user in auth.users if they don't exist, or update password if they do
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'nuwahoorabrian@gmail.com';

  IF new_user_id IS NULL THEN
    -- Create new user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'nuwahoorabrian@gmail.com',
      crypt('KBA7674@brianz', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;
  ELSE
    -- Update existing user password
    UPDATE auth.users 
    SET encrypted_password = crypt('KBA7674@brianz', gen_salt('bf')),
        updated_at = now()
    WHERE id = new_user_id;
  END IF;

  -- 2. Ensure the user has the Admin role
  -- Remove any existing roles first to avoid duplicates
  DELETE FROM public.user_roles WHERE user_id = new_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin');

  -- 3. Ensure the user is approved (required by our new approval workflow)
  UPDATE public.profiles 
  SET is_approved = true,
      name = 'Admin'
  WHERE user_id = new_user_id;

END $$;
