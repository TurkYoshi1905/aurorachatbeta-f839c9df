

## Plan: v0.2.0 — Thread Sistemi, Rol İzinleri & Gelişmiş Profil Kartı

Bu plan 3 ana özellik içerir: Thread/Konu sistemi, Discord benzeri rol izinleri ve gelişmiş kullanıcı profil kartı.

---

### 1. Thread (Konu) Sistemi

**Veritabanı:**
```sql
CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL,
  server_id uuid NOT NULL,
  name text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  attachments text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
```
- RLS: Sunucu üyeleri okuyabilir, giriş yapmış kullanıcılar yazabilir
- Realtime: `thread_messages` tablosunu realtime'a ekle

**UI:**
- `ChatArea.tsx`: Mesaj hover menüsüne "Konu Başlat" butonu ekle (MessageSquare ikonu)
- Yeni `ThreadPanel.tsx` bileşeni: Sağ taraftan açılan panel (Sheet/side panel), thread mesajlarını listeler ve yeni mesaj gönderme input'u içerir
- Bir mesajın altında kaç yanıt olduğunu gösteren küçük bir buton: "3 yanıt" → tıklanınca thread paneli açılır
- Thread paneli açıkken MemberList gizlenir

### 2. Rol & İzin Sistemi (Discord Benzeri)

**Veritabanı:**
```sql
-- server_roles tablosuna permissions sütunu ekle
ALTER TABLE public.server_roles ADD COLUMN permissions jsonb NOT NULL DEFAULT '{}';
```

Permissions JSON yapısı:
```json
{
  "manage_channels": false,
  "manage_roles": false,
  "kick_members": false,
  "ban_members": false,
  "manage_messages": false,
  "pin_messages": false,
  "mention_everyone": false
}
```

**ServerSettings.tsx — Roles sekmesi güncelleme:**
- Her role tıklandığında izin düzenleme paneli aç
- Discord tarzı toggle switch'ler ile her izni aç/kapa
- İzin kategorileri: Genel (kanal yönetimi, rol yönetimi), Üye (kick, ban), Metin (mesaj silme, sabitleme, @everyone)

**İzin kontrolü:**
- `Index.tsx`'te mevcut `isOwner` kontrollerini genişlet: `isOwner || hasPermission('manage_messages')` gibi
- Yeni yardımcı fonksiyon: `checkPermission(userRoles, permission)` — kullanıcının rollerinden herhangi birinde ilgili izin varsa true döner
- Pin, delete, kick gibi aksiyonlar artık hem owner hem de ilgili izne sahip roller tarafından yapılabilir

### 3. Kullanıcı Profil Kartı (Discord Benzeri)

Mevcut `UserProfileCard.tsx` popover'ını genişlet:

- **Banner**: Renkli gradient (mevcut) yerine kullanıcı özel banner rengi desteği (profil tablosuna `banner_color` sütunu ekle)
- **Durum göstergesi**: Avatar'ın yanında online/idle/dnd/offline durumu göster (members listesinden aktarılacak)
- **Bio/Hakkımda**: Profil tablosuna `bio` sütunu ekle, kartda göster
- **Not alanı**: Kullanıcı başka bir kullanıcıya özel not yazabilsin (client-side localStorage)
- **Mesaj gönder butonu**: Profil kartından direkt DM başlatma butonu

**Veritabanı:**
```sql
ALTER TABLE public.profiles ADD COLUMN bio text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN banner_color text DEFAULT '#5865F2';
```

**Profil kartı genişletilmiş görünüm:**
```text
┌─────────────────────────┐
│  ████ BANNER ████████  │
│  ┌──────┐               │
│  │Avatar│ ● Online      │
│  └──────┘               │
│  Görünen Ad             │
│  @kullaniciadi          │
│  ─────────────────────  │
│  HAKKIMDA               │
│  Merhaba! Ben bir...    │
│  ─────────────────────  │
│  ROLLER                 │
│  [Admin] [Moderatör]    │
│  ─────────────────────  │
│  ÜYE OLMA TARİHİ       │
│  🗓️ 01 Oca 2026        │
│  📥 15 Mar 2026         │
│  ─────────────────────  │
│  NOT                    │
│  [not yaz...]           │
│  ─────────────────────  │
│  [📩 Mesaj Gönder]      │
└─────────────────────────┘
```

### 4. Sürüm Notları & i18n

- `changelogData.ts` ve `ReleaseNotesModal.tsx`: v0.2.0 güncelle
- 6 dile yeni anahtarlar ekle: thread, permissions, profileCard genişletme

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| **SQL Migration** | `threads` + `thread_messages` tabloları, `permissions` jsonb sütunu, `bio` + `banner_color` profil sütunları |
| `src/components/ThreadPanel.tsx` | **YENİ** — Thread mesaj paneli |
| `src/components/ChatArea.tsx` | Thread başlatma butonu, thread yanıt sayısı gösterimi |
| `src/pages/Index.tsx` | Thread state/handler'ları, permission kontrol fonksiyonu |
| `src/pages/ServerSettings.tsx` | Rol izin düzenleme UI (toggle switch'ler) |
| `src/components/UserProfileCard.tsx` | Banner, bio, durum, not, DM butonu |
| `src/components/MemberList.tsx` | Profil kartına status bilgisi aktarımı |
| `src/data/changelogData.ts` | v0.2.0 notları |
| `src/components/ReleaseNotesModal.tsx` | Versiyon güncelle |
| `src/i18n/*.ts` | 6 dilde yeni anahtarlar |

