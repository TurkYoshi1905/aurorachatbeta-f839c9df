

## Plan: v0.0.6 Sürüm Notu + DM & Arkadaşlık Sistemi

### 1. Veritabanı Değişiklikleri (Migration)

**`friends` tablosu:**
```sql
CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
```

RLS politikaları:
- SELECT: `auth.uid() = sender_id OR auth.uid() = receiver_id`
- INSERT: `auth.uid() = sender_id`
- UPDATE: `auth.uid() = receiver_id` (sadece alıcı kabul edebilir)
- DELETE: `auth.uid() = sender_id OR auth.uid() = receiver_id`

**`direct_messages` tablosu:**
```sql
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
```

RLS politikaları:
- SELECT: `auth.uid() = sender_id OR auth.uid() = receiver_id`
- INSERT: `auth.uid() = sender_id`

### 2. Navigasyon — Mesaj Simgesi (ServerSidebar)

`ServerSidebar` içindeki mevcut mesaj simgesi (satır 19-28, `onServerChange('home')`) zaten var. `handleServerChange` içinde `id === 'home'` şu an `return` ile atlanıyor (satır 561). Bu mantık değişecek:
- `activeServer === 'home'` olduğunda `Index.tsx` ana içerik alanı sunucu görünümü yerine **DM Dashboard** gösterecek.

### 3. Yeni Bileşenler

**`src/components/DMDashboard.tsx`** — Ana DM sayfası:
- Üst kısımda sekmeler: "Tümü", "Çevrimiçi", "Bekleyen İstekler", "Arkadaş Ekle"
- Arkadaş listesi (profiles'tan display_name ve avatar çekilerek)
- Boş durum: "Henüz kimseyle arkadaş değilsin" + "Arkadaş Ekle" butonu
- Arkadaş ekleme: kullanıcı adı ile arama, istek gönderme
- Bekleyen isteklerde kabul/reddet butonları
- Arkadaşa tıklanınca DM sohbetine geçiş

**`src/components/DMChatArea.tsx`** — Direkt mesaj sohbet alanı:
- `ChatArea`'ya benzer yapı ama kanal yerine kişi bazlı
- `direct_messages` tablosundan geçmiş mesajları çek
- Supabase Realtime ile yeni mesajları anlık dinle (postgres_changes INSERT on direct_messages)
- Mesaj gönderme

### 4. Index.tsx Değişiklikleri

- `handleServerChange`: `id === 'home'` durumunda `setActiveServer('home')` yapılacak
- Render mantığı: `activeServer === 'home'` ise `ChannelList + ChatArea` yerine `DMDashboard` render edilecek
- DM Dashboard'dan bir arkadaş seçilince `DMChatArea`'ya geçiş (yeni state: `activeDMUser`)
- `activeDMUser` set edilmişse `DMChatArea`, değilse arkadaş listesi gösterilecek

### 5. Settings.tsx — v0.0.6 Sürüm Notu

`changelogData` dizisinin başına yeni entry:
```
version: '0.0.6'
date: '2 Mart 2026'
sections:
  - Yeni Özellikler: DM sistemi, Arkadaşlık sistemi, Yazıyor göstergesi
  - Düzeltilen Hatalar: Emoji reaksiyon realtime fix
```

### 6. Görsel Düzen (Desktop)

```text
┌──────┬────────────────────────────────────────────┐
│  DM  │  Arkadaşlar  │ Tümü │ Çevrimiçi │ Bekleyen │ Ekle │
│ icon ├────────────────────────────────────────────┤
│      │  [Avatar] Ahmet          Mesaj Gönder →    │
│ srv1 │  [Avatar] Mehmet         Mesaj Gönder →    │
│      │                                            │
│ srv2 │  — veya DM sohbet açıksa —                 │
│      │  [Mesaj geçmişi]                           │
│  +   │  [Input alanı]                             │
└──────┴────────────────────────────────────────────┘
```

### Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|---|---|
| Migration SQL | `friends` + `direct_messages` tabloları + RLS + realtime |
| `src/components/DMDashboard.tsx` | Yeni — Arkadaş listesi, sekmeler, arkadaş ekleme |
| `src/components/DMChatArea.tsx` | Yeni — DM sohbet alanı |
| `src/pages/Index.tsx` | `home` server seçimi DM'e yönlendirme, yeni state'ler |
| `src/components/ServerSidebar.tsx` | Küçük güncelleme (aktif `home` stili) |
| `src/pages/Settings.tsx` | v0.0.6 changelog entry |

