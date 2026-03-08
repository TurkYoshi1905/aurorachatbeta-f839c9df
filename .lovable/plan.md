

## Plan: v0.1.4 — Sesli Sohbet, Kanal Kategorileri, @Mention, Splash Screen

Bu plan 5 ana modülden oluşuyor. Sırasıyla uygulayacağız.

---

### 1. Veritabanı Değişiklikleri (SQL Migration)

**Yeni tablo: `channel_categories`**
```sql
CREATE TABLE channel_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE channel_categories ENABLE ROW LEVEL SECURITY;
-- RLS: server üyeleri görebilir, sahipler CRUD yapabilir
```

**`channels` tablosuna `category_id` sütunu ekleme:**
```sql
ALTER TABLE channels ADD COLUMN category_id uuid REFERENCES channel_categories(id) ON DELETE SET NULL;
```

**`DbChannel` interface güncelleme:** `category_id?: string` eklenir.

---

### 2. WebRTC Sesli Sohbet (LiveKit Cloud)

**Gerekli secret'lar:**
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_URL`

Kullanıcıdan [LiveKit Cloud](https://cloud.livekit.io) üzerinden ücretsiz hesap açıp bu değerleri girmesi istenecek.

**Edge Function: `livekit-token`**
- Kullanıcı ses kanalına tıkladığında çağrılır
- `room` (channel_id) ve `identity` (user_id) alır, LiveKit JWT token üretir
- CORS + auth doğrulaması

**Client tarafı:**
- `livekit-client` npm paketi eklenir
- Yeni `VoiceChannel` bileşeni: ses kanalına bağlanma, mikrofon/kulaklık toggle, bağlantıyı kes
- `ChannelList` içinde ses kanalı altında bağlı kullanıcı listesi + voice activity (yeşil halka)
- `UserInfoPanel` altına "Bağlanıldı: #kanal-adı" bar'ı eklenir

**Yeni bileşenler:**
| Bileşen | Görev |
|---|---|
| `VoicePanel.tsx` | Bağlantı durumu, mikrofon/kulaklık kontrolleri, bağlantıyı kes |
| `VoiceParticipants.tsx` | Katılımcı listesi + speaking indicator |

---

### 3. Kanal Kategorileri + Sürükle-Bırak

**`@dnd-kit/core` ve `@dnd-kit/sortable`** paketleri eklenir.

**ServerSettings — yeni "Kanallar" sekmesi:**
- Kategorileri ve altındaki kanalları hiyerarşik liste olarak gösterir
- Yeni kategori oluştur / sil butonları
- Yeni kanal oluştur (kategoriye bağlı) / sil butonları
- Sürükle-bırak ile kanal sırası ve kategori atamasını değiştir → `position` + `category_id` güncelle

**ChannelList sidebar güncelleme:**
- Kanalları kategorilere göre grupla
- Kategorisi olmayanları "Genel" başlığı altında göster
- Collapsible kategori başlıkları

---

### 4. @Mention Sistemi

**Mesaj inputu:**
- `@` yazıldığında sunucu üyelerini filtreleyen bir popup açılır (cmdk zaten kurulu, onu kullanabiliriz)
- Seçilen kullanıcı `@kullanıcıAdı` formatında eklenir

**Mesaj render:**
- `renderMessageContent` fonksiyonunda `@kullanıcıAdı` kalıpları mavi/vurgulu `<span>` olarak render edilir

**Bildirim:**
- Etiketlenen kullanıcıya toast bildirimi + tarayıcı Notification API ile sesli uyarı (sekme açıksa)

---

### 5. Splash Screen (Yükleme Ekranı)

**`SplashScreen.tsx` bileşeni:**
- AuroraChat logosu + "AuroraChat Yükleniyor..." animasyonu
- Yükleme adımları göstergesi (session, sunucular, profil)

**`Index.tsx` entegrasyonu:**
- Tüm ilk veriler (`Promise.all`: session, servers, profile) yüklenene kadar splash göster
- Yükleme tamamlandığında "Uygulamaya Giriş Yapılıyor" geçiş animasyonu → ana ekran

---

### 6. v0.1.4 Sürüm Notları

**`changelogData.ts`** — v0.1.4 girişi eklenir.

**Release Notes Modal:**
- Uygulama yüklendiğinde, kullanıcı bu sürümü ilk kez görüyorsa (`localStorage` flag) modal gösterir:
  - [SES] WebRTC tabanlı sesli sohbet kanalları
  - [YÖNETİM] Sürükle-bırak kanal yönetimi ve kategori sistemi
  - [SOSYAL] @Etiketleme özelliği
  - [PERFORMANS] Akıllı yükleme ekranı

---

### Uygulama Sırası

1. DB migration (categories + channels.category_id)
2. LiveKit secret'ları iste → edge function → VoicePanel/VoiceParticipants
3. dnd-kit kurulumu → ServerSettings kanal sekmesi → ChannelList kategori görünümü
4. @Mention popup + render + bildirim
5. SplashScreen bileşeni + Index entegrasyonu
6. Changelog + release modal

### Yeni Paketler
- `livekit-client` — WebRTC ses bağlantısı
- `@dnd-kit/core`, `@dnd-kit/sortable` — sürükle-bırak

