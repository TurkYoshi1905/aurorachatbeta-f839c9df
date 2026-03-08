## Plan: v0.2.1 — Sunucu Emoji Sistemi & Gelişmiş Rol Yetkileri

### 1. Veritabanı Değişiklikleri

**Yeni `server_emojis` tablosu:**

```sql
CREATE TABLE public.server_emojis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(server_id, name)
);
-- RLS: sunucu üyeleri okuyabilir, sunucu sahipleri CRUD yapabilir
```

`**server_roles.permissions` genişletme** — mevcut JSON yapısına yeni anahtarlar eklenir (kod tarafında):

- `administrator`, `manage_server`, `attach_files`, `manage_emojis`

Mevcut roller zaten `permissions jsonb DEFAULT '{}'` kullanıyor, yeni anahtarlar eklenmesi geriye uyumlu.

**Storage**: `avatars` bucket'ı kullanılacak, path: `{userId}/servers/{serverId}/emojis/{emojiId}.{ext}`

### 2. Sunucu Emoji Sistemi

**ServerSettings.tsx — Yeni "Emojiler" sekmesi:**

- Emoji listesi (ad, görsel, silme butonu)
- Yükleme formu: dosya seçici + isim input'u
- 50 emoji sınırı göstergesi (ör. "12/50")
- Toplu silme: checkbox ile seçim + "Seçilenleri Sil" butonu
- İsim düzenleme: inline edit

**ChatArea.tsx — Emoji render:**

- `renderMessageContent` fonksiyonunu genişlet: `:emoji_adi:` pattern'ini regex ile yakala
- Sunucunun özel emoji listesini prop olarak al
- Eşleşen emoji adlarını `<img>` tag'ı ile render et (32x32)

**EmojiPicker.tsx — Özel emoji sekmesi:**

- Mevcut picker'a "Sunucu" kategorisi ekle
- Sunucu emojilerini grid olarak göster, tıklayınca `:ad:` olarak input'a ekle

### 3. Gelişmiş Rol & Yetki Sistemi

**ServerSettings.tsx — Rol oluşturma UI güncelleme:**

- PRESET_COLORS yerine/yanına HEX input alanı ekle (manuel giriş)
- Color picker: Palette + HEX text input birlikte çalışsın
- Mevcut preset renkler korunsun, altına `#` ile HEX girişi eklensin

**Yetki listesi genişletme** — `PERMISSION_CATEGORIES` güncelle:

```
Genel: administrator, manage_server, manage_channels, manage_roles, manage_emojis
Üye: kick_members, ban_members
Metin: manage_messages, pin_messages, mention_everyone, attach_files, send_messages
```

- `administrator` toggle'ı aktif olunca tüm diğer toggle'lar otomatik aktif görünsün
- Discord tarzı: administrator açıkken diğerleri disabled + checked

### 4. Dosya Değişiklikleri


| Dosya                                  | Değişiklik                                                             |
| -------------------------------------- | ---------------------------------------------------------------------- |
| **SQL Migration**                      | `server_emojis` tablosu + RLS                                          |
| `src/pages/ServerSettings.tsx`         | "Emojiler" sekmesi, HEX color picker, genişletilmiş permission listesi |
| `src/components/ChatArea.tsx`          | `:emoji:` render desteği, serverEmojis prop                            |
| `src/components/EmojiPicker.tsx`       | Sunucu emoji kategorisi                                                |
| `src/pages/Index.tsx`                  | Sunucu emojilerini fetch et, ChatArea'ya aktar                         |
| `src/data/changelogData.ts`            | v0.2.1 sürüm notları                                                   |
| `src/components/ReleaseNotesModal.tsx` | Versiyon güncelle                                                      |
| `src/i18n/*.ts`                        | Yeni çeviri anahtarları (6 dil)                                        |
