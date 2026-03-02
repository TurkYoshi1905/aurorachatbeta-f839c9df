

## Plan: Emoji Reaksiyon Fix + Discord Stili "Yazıyor..." Göstergesi

### 1. Emoji Reaksiyon Realtime Fix

**Sorun:** Realtime reactions kanalı optimistik güncelleme ile çakışıyor — aynı kullanıcının kendi aksiyonu hem optimistik hem de realtime'dan geliyor, çift sayım veya geri alma sorununa yol açıyor.

**Çözüm:** Realtime INSERT/DELETE handler'larında, aksiyonu yapan kullanıcının kendi event'lerini yok say (optimistik güncelleme zaten uygulandığı için). Diğer kullanıcılardan gelen event'ler normal şekilde işlenecek.

- `src/pages/Index.tsx` — Realtime reactions INSERT handler'ına `if (r.user_id === user?.id) return prev;` kontrolü ekle
- Aynı şekilde DELETE handler'ına da aynı kontrol

### 2. Discord Stili "Yazıyor..." Göstergesi

**Yaklaşım:** Supabase Broadcast kanalı kullanılacak (veritabanına yazma yok, hafif).

**Dosya değişiklikleri:**

#### `src/pages/Index.tsx`
- Yeni state: `typingUsers` (Map veya array: `{userId, displayName}`)
- Yeni broadcast kanalı: `typing-{channelId}` — kanal değiştiğinde yeniden abone ol
- `handleTypingStart` fonksiyonu: broadcast ile `{userId, displayName}` gönder
- Broadcast dinleyici: gelen typing event'lerini `typingUsers` state'ine ekle, 3sn timeout ile otomatik kaldır
- `ChatArea`'ya yeni prop'lar: `typingUsers`, `onTypingStart`

#### `src/components/ChatArea.tsx`
- Yeni prop'lar: `typingUsers` (array) ve `onTypingStart` (callback)
- Input `onChange`'de debounce ile `onTypingStart` çağır (her tuş vuruşunda değil, 2sn aralıkla)
- Input boşaldığında typing durumunu durdur
- Mesaj giriş kutusunun hemen üstünde typing göstergesi render et:
  - 1 kişi: `"[Ad] yazıyor..."`
  - 2 kişi: `"[Ad1] ve [Ad2] yazıyor..."`
  - 3 kişi: `"[Ad1], [Ad2] ve [Ad3] yazıyor..."`
  - 3+: `"3'ten fazla kullanıcı yazıyor..."`
- Üç nokta animasyonu (CSS bouncing dots)

### Görünüm
```text
┌─────────────────────────────────────┐
│  ... mesajlar ...                   │
│                                     │
│  ● ● ● Ahmet yazıyor...            │  ← typing indicator
│  ┌─────────────────────────────┐    │
│  │ #genel kanalına mesaj gönder│    │  ← input
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Değişecek dosyalar
- `src/pages/Index.tsx` — broadcast kanalı, typing state, reaction fix
- `src/components/ChatArea.tsx` — typing UI, onTypingStart prop

