

## Plan: v0.1.5 — Navigasyon Döngüsü Düzeltme, DnD Fix, UI Stabilizasyonu

---

### 1. Splash Screen Döngüsünü Kır (Kritik)

**Sorun:** `splashDone` state'i `Index` bileşeninde tutuluyor. Kullanıcı `/settings`'e gidip geri döndüğünde `Index` unmount/remount oluyor ve `splashDone` sıfırlanıyor → tekrar splash screen gösteriliyor.

**Çözüm:**
- `splashDone` durumunu `sessionStorage` ile persist et. İlk açılışta splash göster, sonraki navigasyonlarda atla.
- `Index.tsx`'de: `useState(() => sessionStorage.getItem('splashDone') === 'true')` ile başlat, `onEnter`'da `sessionStorage.setItem('splashDone', 'true')` yaz.

### 2. ServerSettings Navigasyonu Düzelt

**Sorun:** ESC/Geri butonu `navigate('/')` yapıyor, bu da `Index`'i yeniden mount ediyor.

**Çözüm:**
- `navigate('/')` yerine `navigate(-1)` kullan (tarayıcı geçmişinde geri git). Eğer geçmiş yoksa fallback olarak `navigate('/')` kullan.
- `ServerSettings.tsx` line 133 ve diğer `navigate('/')` çağrılarını güncelle.

### 3. Drag & Drop Kanal Yönetimi (ServerSettings)

**Sorun:** Şu an kanallar sadece liste halinde görünüyor, sürükle-bırak yok.

**Çözüm:** `@dnd-kit/core` ve `@dnd-kit/sortable` kullanarak ServerSettings channels sekmesine DnD ekle:
- Her kanal bir `SortableItem` olacak
- Kategoriler arası sürükleme: `onDragEnd`'de hedef kategorinin `category_id`'sini ve `position`'ını güncelle
- DB'ye kaydet: `supabase.from('channels').update({ category_id, position })`
- Kayıt sonrası sidebar otomatik güncellenir (realtime channel zaten var)

### 4. Sidebar Kanal Hiyerarşisi İyileştirmesi

**Çözüm:** `ChannelList.tsx`'de kategorili kanallar için `pl-4` (sol girinti) ekle, kategorisiz kanallardan görsel olarak ayrıştır.

### 5. Sesli Kanal Geçiş Temizliği

**Sorun:** Bir ses kanalından diğerine geçerken eski bağlantı temizlenmiyor.

**Çözüm:** `useVoiceChannel.ts` `connect` fonksiyonunda, yeni bağlantı kurmadan önce mevcut `roomRef.current` varsa `disconnect()` çağır.

### 6. v0.1.5 Sürüm Notları

- `changelogData.ts`'ye v0.1.5 girişi ekle
- `ReleaseNotesModal`'daki versiyon kontrolünü `0.1.5`'e güncelle

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/pages/Index.tsx` | `splashDone` → sessionStorage persist |
| `src/pages/ServerSettings.tsx` | DnD entegrasyonu + `navigate(-1)` |
| `src/components/ChannelList.tsx` | Kategorili kanallara girinti (`pl-4`) |
| `src/hooks/useVoiceChannel.ts` | `connect` içinde eski bağlantıyı temizle |
| `src/data/changelogData.ts` | v0.1.5 notları |
| `src/components/ReleaseNotesModal.tsx` | Versiyon güncelleme |

