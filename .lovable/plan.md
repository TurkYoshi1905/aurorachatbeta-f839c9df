

## Plan: v0.2.4 — Filtreli Mesaj Arama, Bildirim Ayarları & Bildirim Geçmişi

### 1. Sürüm Güncelleme

- **`ReleaseNotesModal.tsx`**: `CURRENT_VERSION = '0.2.4'`, notları yeni özelliklerle güncelle
- **`changelogData.ts`**: v0.2.4 girişi ekle (Filtreli mesaj arama, bildirim ayarları, bildirim geçmişi)

### 2. Filtreli Mesaj Arama

**Konum:** `ChatArea.tsx` — Üst bardaki mevcut `Search` ikonuna tıklanınca açılan arama paneli

**Özellikler:**
- Arama input alanı + filtre seçenekleri (Popover/dropdown):
  - **Gönderen:** Kullanıcı adına göre filtrele
  - **Tarih aralığı:** Başlangıç-bitiş tarihi seçici
  - **İçerik türü:** Sadece dosyalar, sadece sabitlenmiş, sadece linkler
  - **Kanal:** Mevcut kanal veya tüm kanallarda arama
- Supabase'den `messages` tablosunda `ilike` sorgusu ile arama
- Sonuçlar listesinde mesaja tıklayınca ilgili mesaja scroll
- Arama sonucu sayısı gösterimi

**Dosya:** `src/components/ChatArea.tsx` (arama UI) + yeni `src/components/MessageSearchPanel.tsx` bileşeni

### 3. Bildirim Ayarları (Kanal Bazlı)

**Veritabanı:** Yeni `notification_settings` tablosu:
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  mute_until TIMESTAMPTZ,
  suppress_everyone BOOLEAN DEFAULT false,
  suppress_roles BOOLEAN DEFAULT false,
  notify_level TEXT DEFAULT 'all', -- 'all', 'mentions', 'none'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel_id)
);
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
-- RLS: kullanıcılar sadece kendi ayarlarını okuyup yazabilir
```

**UI:** `ChatArea.tsx` üst barda `Bell` ikonuna tıklanınca popover:
- Tüm bildirimler / Sadece etiketlemeler / Bildirimleri kapat
- @everyone/@here bastırma toggle'ı
- Kanal susturma (süre seçenekleri: 15dk, 1sa, 8sa, 24sa, süresiz)

**Mantık:** `Index.tsx`'teki bildirim gönderme kodu, mesaj geldiğinde `notification_settings` tablosunu kontrol edip kullanıcının tercihine göre bildirim gösterip göstermeyecek

**Dosya:** Yeni `src/components/NotificationSettingsPopover.tsx`, `ChatArea.tsx`'e entegre

### 4. Bildirim Geçmişi (Gerçek Zamanlı)

**Veritabanı:** Yeni `notifications` tablosu:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'mention', 'reply', 'pin', 'server_invite'
  title TEXT NOT NULL,
  body TEXT,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

**UI:** Yeni bir bildirim paneli/sayfası:
- Üst barda veya yan panelde bildirim ikonu (okunmamış sayacı badge ile)
- Bildirim listesi: etiketlemeler, yanıtlar, sabitleme, davet bildirimleri
- Tıklanınca ilgili kanala/mesaja yönlendirme
- "Tümünü okundu işaretle" butonu
- Realtime subscription ile yeni bildirimler anında görünür

**Gerçek zamanlı:** `notifications` tablosuna realtime subscription ekle. Mesaj geldiğinde (mention/reply), bir database trigger veya client-side logic ile `notifications` tablosuna kayıt ekle.

**Dosya:** Yeni `src/components/NotificationPanel.tsx`, `Index.tsx`'e entegre

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/components/ReleaseNotesModal.tsx` | v0.2.4 |
| `src/data/changelogData.ts` | v0.2.4 sürüm notları |
| `src/components/MessageSearchPanel.tsx` | **Yeni** — Filtreli mesaj arama bileşeni |
| `src/components/ChatArea.tsx` | Arama paneli entegrasyonu + bildirim ayarları butonu |
| `src/components/NotificationSettingsPopover.tsx` | **Yeni** — Kanal bazlı bildirim ayarları |
| `src/components/NotificationPanel.tsx` | **Yeni** — Bildirim geçmişi paneli |
| `src/pages/Index.tsx` | Bildirim paneli + bildirim mantığını notification_settings ile kontrol |
| **DB Migration** | `notification_settings` + `notifications` tabloları + RLS + realtime |

