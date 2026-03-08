## Plan: v0.1.7 — Mobil Mesaj Çubuğu Yenileme

### 1. ChatArea.tsx — Mobil Input Bar Yeniden Yapılandırma (Satır 326-362)

**Mevcut durum:** Tüm ikonlar (PlusCircle, ImagePlus, GifPicker, EmojiPicker, Send) her zaman görünür → mobilde taşıyor.

**Yeni yapı (mobil):**

```text
┌──────────────────────────────────────┐
│ [+]  [Mesaj gönder...      😊]  [➤] │
└──────────────────────────────────────┘
```

- `isMobile` prop'una göre koşullu render
- **Sol:** Sadece `+` butonu (tıklanınca dosya seçici + ImagePlus açılır)
- **Orta:** `flex-1` input, sağ ucunda Emoji ikonu (`absolute right-2` pozisyonla, input içi)
- **Sağ:** Daima görünür Send butonu (ok simgesi)
- GIF picker → mobilde `+` menüsü Popover içine taşınacak (ImagePlus + GifPicker birlikte)
- Desktop'ta mevcut düzen korunacak
- Input `min-h-[44px]`, `rounded-2xl` (Discord mobile tarzı)
- Container'a `pb-[env(safe-area-inset-bottom)]` ekle

**Plus menü yapısı (mobil):**

```text
Popover açılır:
  📷 Resim Ekle
  🎬 GIF Gönder
```

### 2. ChatArea.tsx — Klavye Uyumu

- Ana container `px-4 pb-6` → mobilde `pb-[calc(env(safe-area-inset-bottom)+8px)]`
- Slash/mention popup z-index: `z-50`

### 3. ChatArea.tsx — Mobil Placeholder Kısaltma

- `isMobile` ise placeholder: `"Mesaj gönder..."` yerine uzun kanal adı formatı

### 4. UserInfoPanel.tsx — Mobil Optimizasyon

- Kullanıcı adı `max-w-[80px]` + `truncate`
- ChevronDown butonlarına `min-w-[30px] min-h-[30px]` touch target
- Panel yüksekliği korunacak, sadece iç elemanlar daraltılacak

### 5. v0.1.7 Sürüm Notları

- `changelogData.ts`: v0.1.7 girişi ekle
- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.1.7'`
- Notlar: Mobil input bar yenilendi, safe area desteği, klavye uyumu, kullanıcı paneli optimizasyonu

### Dosya Değişiklikleri


| Dosya                                  | Değişiklik                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `src/components/ChatArea.tsx`          | Mobil input bar yeniden yapılandırma, plus menü, emoji input içi, safe area |
| `src/components/UserInfoPanel.tsx`     | Mobil daraltma, touch target genişletme                                     |
| `src/data/changelogData.ts`            | v0.1.7 notları                                                              |
| `src/components/ReleaseNotesModal.tsx` | Versiyon güncelle                                                           |
