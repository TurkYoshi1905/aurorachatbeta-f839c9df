
High Priority Çözüm Planı: `supabaseUrl is required` Hatasını Kalıcı Olarak Giderme

1) Kök Neden (Detaylı Tespit)
- Runtime’da `/src/integrations/supabase/client.ts` network cevabını inceledim.
- Dosyanın başında şu var:
  - `import.meta.env = { BASE_URL, DEV, MODE, PROD, SSR }`
  - `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` yok.
- Sonuç:
  - `SUPABASE_URL === undefined`
  - `createClient(undefined, ...)` çağrısı yapılıyor ve uygulama siyah ekranda çöküyor.
- Yani sorun client kodundan çok, Vite tarafında bu env değişkenlerinin preview build’e enjekte edilmemesi.

2) Uygulanacak Düzeltme (Auto-generated dosyalara dokunmadan)
- `src/integrations/supabase/client.ts` dosyasını değiştirmeden çözeceğim.
- `vite.config.ts` içinde env köprüsü ekleyeceğim:
  - `loadEnv(mode, process.cwd(), '')` ile tüm env’leri okuyacağım.
  - `VITE_SUPABASE_URL` yoksa `SUPABASE_URL` fallback’i kullanacağım.
  - `VITE_SUPABASE_PUBLISHABLE_KEY` yoksa `SUPABASE_PUBLISHABLE_KEY` fallback’i kullanacağım.
  - Her ikisi de yoksa (son güvenlik ağı) publishable değerleri `define` ile enjekte edeceğim.
- Böylece preview ortamında `import.meta.env.VITE_SUPABASE_URL` ve key garanti edilmiş olacak.

3) Kod Düzeyi Değişiklik Tasarımı
- Dosya: `vite.config.ts`
- Değişiklikler:
  - `defineConfig` import’una `loadEnv` eklenecek.
  - Config’i block return’a çevireceğim.
  - `define` alanı eklenecek:
    - `'import.meta.env.VITE_SUPABASE_URL'`
    - `'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY'`
- Öncelik sırası:
  1. `env.VITE_*`
  2. `env.SUPABASE_*`
  3. son fallback (publishable değerler)

4) Güvenlik ve Stabilite Notları
- Sadece publishable (anon/public) key kullanılacak; gizli servis anahtarı kesinlikle frontend’e taşınmayacak.
- Auto-generated Supabase client dosyası korunacak.
- Çözüm hem local dev hem preview senaryosunda çalışacak.

5) Doğrulama Planı (E2E)
- Uygulamayı açınca siyah ekran olmamalı.
- Console’da `supabaseUrl is required` hatası sıfırlanmalı.
- Login/Register sayfası açılmalı.
- Network’te auth/profiles istekleri başlamalı.
- DM ve kanal akışında veri çekimi başlamalı (ilk render çökmeden).

6) Ek Koruma (Opsiyonel ama önerilen)
- `src/main.tsx` veya kök route’a ErrorBoundary ekleyip benzer init hatalarında boş siyah ekran yerine kullanıcıya anlamlı hata ekranı göstereceğim.
- Bu, env dışı gelecekteki boot hatalarında da uygulamanın “sessiz çökmesini” engeller.

7) Değişecek Dosyalar
- `vite.config.ts` (zorunlu)
- (Opsiyonel) `src/components/ErrorBoundary.tsx` + `src/main.tsx` (kullanıcıya görünür hata fallback’i için)
