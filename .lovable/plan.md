

## Plan: v0.2.1-patch — Emoji Resize Edge Function, Emoji Autocomplete & Yüksek Kalite Görseller

### 1. Emoji Resize Edge Function

Yeni `supabase/functions/resize-emoji/index.ts`:
- POST request ile base64 veya binary image alır
- Canvas API (veya sharp benzeri bir Deno kütüphanesi yerine, `ImageMagick` Deno WASM modülü) ile 64x64px'e resize eder
- Resize edilmiş görseli döner

**Akış:**
- `ServerSettings.tsx`'te `handleEmojiUpload` fonksiyonunda: dosyayı önce edge function'a gönder → resize edilmiş blob'u al → Storage'a yükle
- `supabase/config.toml`'a `[functions.resize-emoji]` ekle

**Not:** Deno edge functions'ta en pratik yaklaşım: görseli FormData ile gönder, `jsr:@syumai/image` veya basit canvas approach ile resize et. Alternatif olarak client-side `<canvas>` ile resize yapılabilir (edge function gerektirmez, daha hızlı). Client-side yaklaşımı tercih edeceğim — daha az karmaşık ve sıfır latency.

**Revize: Client-side canvas resize** — `ServerSettings.tsx`'te yükleme öncesi `resizeImage(file, 64, 64)` helper fonksiyonu:
```typescript
const resizeImage = (file: File, w: number, h: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => resolve(b!), 'image/png');
    };
    img.src = URL.createObjectURL(file);
  });
};
```
Ek olarak edge function da oluşturulacak (sunucu tarafı yedek) ama birincil yöntem client-side olacak.

### 2. Emoji Autocomplete Popup

Yeni bileşen: `src/components/EmojiAutocompletePopup.tsx`
- MentionPopup'a benzer yapı (aynı pattern)
- Input'ta `:` yazıldığında tetiklenir (en az 2 karakter sonra, ör. `:sm`)
- `serverEmojis` + built-in emoji listesinden arama yapar
- Klavye navigasyonu: ArrowUp/Down, Enter/Tab ile seç, Escape ile kapat
- Seçim yapılınca: sunucu emojisi ise `:emoji_name:` ekler, built-in ise emoji karakterini ekler

**ChatArea.tsx değişiklikleri:**
- `handleInputChange`'e `:query` pattern tespiti ekle (mevcut `@mention` pattern'ine benzer)
- `showEmojiPopup` + `emojiQuery` state'leri
- Input alanının üstünde popup render et

**DMChatArea.tsx**: Aynı autocomplete desteği (isteğe bağlı, sunucu emojisi yok ama built-in emojiler çalışır)

### 3. Yüksek Kalite Görsel Yükleme

**Mevcut durum:** `MAX_FILE_SIZE = 5MB`, `object-cover` kullanılıyor, görseller sıkıştırma olmadan yükleniyor.

**Değişiklikler:**
- `MAX_FILE_SIZE`'ı `10 * 1024 * 1024` (10MB) yap — daha yüksek kaliteli görseller için
- `MessageAttachments.tsx`: `object-cover` → `object-contain` (kırpma yerine tam görüntüleme)
- `max-h-72` → `max-h-96` (daha büyük görüntüleme alanı)
- Grid layout'u tek resim için `max-w-lg` yap (daha geniş)
- `FileUploadPreview.tsx`: Önizleme boyutunu `w-20 h-20` → `w-24 h-24` yap

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/components/EmojiAutocompletePopup.tsx` | **YENİ** — Emoji autocomplete popup |
| `src/components/ChatArea.tsx` | `:emoji` autocomplete entegrasyonu, emoji popup state |
| `src/pages/ServerSettings.tsx` | `resizeImage` helper, yükleme öncesi 64x64 resize |
| `src/components/MessageAttachments.tsx` | Daha büyük/kaliteli görsel gösterimi |
| `src/components/FileUploadPreview.tsx` | Daha büyük önizleme |
| `src/components/DMChatArea.tsx` | MAX_FILE_SIZE güncelleme |
| `src/components/EmojiPicker.tsx` | EMOJI_KEYWORDS export (autocomplete'in kullanması için) |

