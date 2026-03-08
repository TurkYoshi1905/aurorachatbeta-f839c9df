

## Plan: AuroraChat v0.1.1 Mega Güncelleme

Bu güncelleme 6 büyük özellik grubunu kapsar. Karmaşıklık nedeniyle **3 aşamada** implement edilecek.

---

### AŞAMA 1: Veritabanı Migrasyonları

Yeni tablolar ve değişiklikler:

**1. `server_roles` tablosu**
```sql
CREATE TABLE public.server_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#99AAB5',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.server_roles ENABLE ROW LEVEL SECURITY;
```

**2. `server_member_roles` tablosu (junction)**
```sql
CREATE TABLE public.server_member_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES server_roles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id, role_id)
);
ALTER TABLE public.server_member_roles ENABLE ROW LEVEL SECURITY;
```

**3. `audit_logs` tablosu**
```sql
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

**4. RLS Politikaları** — Tüm tablolarda sunucu üyelerine SELECT, sahiplere INSERT/UPDATE/DELETE izni.

**5. `server_invites` tablosuna** `server_members` INSERT policy güncelleme (şu an sadece owner insert edebiliyor, tüm üyelerin davet oluşturabilmesi gerekiyor).

**6. Realtime** — `audit_logs` için realtime yayını etkinleştir.

---

### AŞAMA 2: Frontend Bileşenleri

**1. DM Realtime İyileştirmesi** (`src/components/DMChatArea.tsx`)
- Mevcut dual-subscription yapısı zaten iyi. Ek olarak `CHANNEL_ERROR` durumunda otomatik resubscribe mekanizması ekle.
- Reconnect: `subscribe()` callback'inde error durumunda 2s delay ile kanalı yeniden oluştur.

**2. Discord Tarzı Davet Sistemi** (`src/components/InviteDialog.tsx` → tam yeniden yaz)
- **Ekran 1**: Arkadaş listesi + arama çubuğu + "Davet Et" butonları (friends tablosundan çek)
- **Ekran 2**: Alt kısımda davet linki + "Kopyala" butonu
- **Dişli Çark butonu → Ekran 3**: Modal içi ayar ekranı:
  - "Daha Sonra Sona Er" Select: 30dk, 1 saat, 6 saat, 12 saat, 1 gün, 7 gün, Asla
  - "Maksimum Kullanım Sayısı" Select: 1, 5, 10, 25, 50, 100, Sınırsız
  - "Yeni Bir Bağlantı Oluştur" butonu (expires_at ve max_uses ile insert)

**3. Tam Sayfa Sunucu Ayarları** (`src/pages/ServerSettings.tsx` — yeni sayfa)
- Route: `/server/:serverId/settings`
- Sol sidebar: Genel Bakış, Roller, Üyeler, Denetim Kaydı, Tehlikeli Bölge
- Sağ alan: Seçili sekmenin içeriği (Settings.tsx yapısı referans)
- `ServerSettingsDialog.tsx` modal kaldırılacak, yerine navigate çağrısı

**4. Rol Yönetimi** (ServerSettings içinde "Roller" sekmesi)
- Rol oluşturma formu: ad + renk seçici (preset renkler)
- Rol listesi: sürükle-bırak pozisyon değişikliği (basit up/down butonları)
- Rol silme

**5. Rol Atama** (ServerSettings "Üyeler" sekmesi)
- Üye tıklandığında dropdown ile rol atama/kaldırma
- `server_member_roles` tablosuna insert/delete

**6. MemberList Güncelleme** (`src/components/MemberList.tsx`)
- Üyeleri rollerine göre grupla (en yüksek pozisyondaki role göre)
- İsim rengini rolün renginde göster
- `server_member_roles` + `server_roles` join sorgusu ile veri çek

**7. Emoji Picker** (`src/components/EmojiPicker.tsx` — yeni)
- Kategoriler: Sık Kullanılan, Yüzler, Eller, Hayvanlar, Yiyecekler, Aktiviteler, Semboller
- Unicode emoji listesi (harici kütüphane yok, statik veri)
- Mesaj input alanına SmilePlus ikonuna tıklayınca açılan Popover

**8. GIF Entegrasyonu** (`src/components/GifPicker.tsx` — yeni)
- Tenor API üzerinden arama (API key gerekli — secret olarak eklenecek)
- Arama çubuğu + grid sonuçlar
- Tıklanan GIF'in URL'si mesaj olarak gönderilir
- Edge function: `tenor-search` — proxy olarak Tenor API'ye istek atar

**9. Audit Logs UI** (ServerSettings içinde "Denetim Kaydı" sekmesi)
- `audit_logs` tablosundan son 100 kaydı çek
- Zaman çizelgesi formatında göster
- Audit log yazma: üye katıldığında, ayrıldığında, rol oluşturulduğunda trigger veya uygulama seviyesinde insert

**10. v0.1.1 Changelog** (`src/data/changelogData.ts`)
- Yeni sürüm girişi ekle (dizinin başına)

---

### AŞAMA 3: Routing & Entegrasyon

**1. App.tsx Routing**
- `/server/:serverId/settings` route ekle (ProtectedRoute)

**2. i18n Güncellemesi**
- Tüm yeni metinler için tr.ts, en.ts ve diğer dil dosyalarına key ekle

**3. ChannelList'ten ServerSettings'e Yönlendirme**
- Modal açmak yerine `navigate(`/server/${serverId}/settings`)` çağır

---

### Değişecek/Oluşturulacak Dosyalar

| Dosya | İşlem |
|---|---|
| DB Migration (3 tablo + RLS + realtime) | Yeni |
| `src/pages/ServerSettings.tsx` | Yeni sayfa |
| `src/components/EmojiPicker.tsx` | Yeni bileşen |
| `src/components/GifPicker.tsx` | Yeni bileşen |
| `supabase/functions/tenor-search/index.ts` | Yeni edge function |
| `src/components/InviteDialog.tsx` | Tam yeniden yaz |
| `src/components/DMChatArea.tsx` | Resubscribe mantığı ekle |
| `src/components/MemberList.tsx` | Rol bazlı gruplama |
| `src/components/ChatArea.tsx` | Emoji/GIF butonları ekle |
| `src/components/ChannelList.tsx` | Settings navigasyonu güncelle |
| `src/App.tsx` | Yeni route |
| `src/pages/Index.tsx` | Member fetch'e rol join ekle |
| `src/data/changelogData.ts` | v0.1.1 ekle |
| `src/i18n/tr.ts`, `en.ts`, diğerleri | Yeni key'ler |
| `src/components/ServerSettingsDialog.tsx` | Kaldır veya redirect wrapper yap |

### Ön Koşullar

- **Tenor API Key**: GIF özelliği için bir Tenor/Google API anahtarı gerekecek. Bunu edge function'da secret olarak kullanacağız. İmplementasyon sırasında sizden isteyeceğim.

