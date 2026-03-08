

## Plan: v0.1.5 Hotfix — GIF Layout, Image Download, Voice Chat

3 sorun, 3 düzeltme.

---

### 1. GIF Mobil Taşması

**Sorun:** `GifImage` bileşeninde `max-w-xs` (320px) mobilde ekranı taşırıyor.

**Çözüm:** `ChatArea.tsx` satır 48'de `max-w-xs` yerine `max-w-[min(320px,100%)]` kullan. Böylece mobilde ekran genişliğini aşmaz.

---

### 2. Resim İndirme Çalışmıyor

**Sorun:** `ImageLightbox.tsx` satır 160-167'de `handleDownload` sadece bir `<a>` etiketi oluşturup `click()` çağırıyor. Cross-origin resimler (Supabase storage) için bu yöntem indirme tetiklemez, sadece yeni sekmede açar.

**Çözüm:** `fetch()` ile resmi blob olarak indir, sonra `URL.createObjectURL` ile indirme bağlantısı oluştur. Cross-origin hata olursa fallback olarak yeni sekmede aç.

---

### 3. Sesli Sohbet Çalışmıyor

**Sorun:** Edge function `livekit-token/index.ts` satır 68'de `supabase.auth.getClaims(token)` kullanıyor. Bu method Supabase JS client'ta mevcut değil — `getUser()` kullanılmalı.

**Çözüm:** `getClaims` yerine `supabase.auth.getUser()` kullan ve `userId`'yi `data.user.id`'den al.

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/components/ChatArea.tsx` | GIF `max-w-xs` → responsive max-width |
| `src/components/ImageLightbox.tsx` | `handleDownload` → fetch+blob indirme |
| `supabase/functions/livekit-token/index.ts` | `getClaims` → `getUser` |

