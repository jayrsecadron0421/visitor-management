INSERT INTO public.users
(full_name, email, phone_number, birthday, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'Admin',
  'jayrsecadron@gmail.com',
  '',
  NULL,
  '$2a$10$CQVPD1J2s4rkMp9zN4mnoOVhkzBZRuxvh.6D6WEKoyux88WpjIyMC',
  'admin',
  true,
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;