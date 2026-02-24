-- Trigger'i yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mevcut kullanıcıların profillerini oluştur
INSERT INTO public.profiles (user_id, display_name, username)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'display_name', 'Kullanıcı'),
  COALESCE(raw_user_meta_data->>'username', id::text)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;