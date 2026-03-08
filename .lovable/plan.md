

## Plan: v0.1.6 — AuroraChat Bot, Slash Komutları, Sesli Sohbet Stabilizasyonu

Bu büyük bir güncelleme. Adım adım:

---

### 1. Veritabanı Değişiklikleri (Migration)

**Yeni tablolar ve sütunlar:**
- `channels` tablosuna `is_locked BOOLEAN DEFAULT false` sütunu ekle
- `server_members` tablosuna `timeout_until TIMESTAMPTZ DEFAULT NULL` sütunu ekle
- Yeni `server_bans` tablosu: `id, server_id, user_id, banned_by, reason, created_at`
  - RLS: Sunucu üyeleri okuyabilir, sunucu sahibi yazabilir/silebilir

**RLS güncellemesi:**
- `server_bans` için SELECT (sunucu üyeleri), INSERT/DELETE (sunucu sahibi) politikaları

---

### 2. Bot Mesaj Sistemi (Client-Side Command Parser)

Sunuculara gerçek bir "bot kullanıcısı" eklemek yerine, **komutları istemci tarafında parse edip bot yanıtlarını özel mesaj olarak** göstereceğiz. Bu yaklaşım daha basit ve veritabanı karmaşıklığını azaltır.

**Akış:**
1. Kullanıcı `/komut` yazıp gönderir
2. `handleSendMessage` içinde komut algılanır (normal mesaj olarak DB'ye kaydedilmez)
3. Komut işlenir ve sonuç bot yanıtı olarak mesaj listesine eklenir
4. Bot yanıtları `isBot: true` ile işaretlenir ve özel UI ile gösterilir

**Yeni dosya: `src/utils/botCommands.ts`**
- Komut parse ve yürütme mantığı
- Her komut için: yetki kontrolü (sunucu sahibi mi?), DB işlemi, yanıt mesajı

**Komutlar:**

| Komut | İşlev | DB İşlemi |
|---|---|---|
| `/help` | Tüm komutları listele | Yok |
| `/info` | Sunucu istatistikleri | SELECT count |
| `/list` | Üye listesi + roller | Mevcut members verisi |
| `/lock` | Kanalı kilitle | `channels.update({ is_locked: true })` |
| `/unlock` | Kilidi aç | `channels.update({ is_locked: false })` |
| `/kick @user` | Üyeyi çıkar | `server_members.delete()` |
| `/ban @user` | Kalıcı uzaklaştırma | `server_bans.insert()` + `server_members.delete()` |
| `/unban @user` | Yasağı kaldır | `server_bans.delete()` |
| `/timeout @user [dakika]` | Geçici susturma | `server_members.update({ timeout_until })` |
| `/untimeout @user` | Susturmayı kaldır | `server_members.update({ timeout_until: null })` |

---

### 3. Kanal Kilitleme UI

- `ChatArea` bileşeninde: eğer kanal `is_locked` ve kullanıcı sunucu sahibi değilse, mesaj giriş kutusunu devre dışı bırak ve "🔒 Bu kanal kilitli" mesajı göster
- `channels` verisine `is_locked` alanını ekle (`DbChannel` interface güncellemesi)
- `Index.tsx`'te `handleSendMessage`'da kilit kontrolü

---

### 4. Bot Mesaj UI

`ChatArea.tsx`'te bot mesajları için:
- Sol tarafta mor/mavi gradient arka plan
- Kullanıcı adının yanında `BOT` badge'i
- Avatar yerine bot ikonu

---

### 5. Slash Komut Öneri Popup'ı

Mesaj kutusuna `/` yazıldığında mevcut komutları gösteren bir autocomplete popup:
- Yeni bileşen: `SlashCommandPopup.tsx`
- Komut listesi, açıklama ve parametre bilgileri
- Seçim yapıldığında komutu mesaj kutusuna yaz

---

### 6. Sesli Sohbet Stabilizasyonu

- `useVoiceChannel.ts`: Bağlantı hata yönetimini güçlendir, retry mantığı ekle
- Bağlantı durumu için kullanıcıya toast bildirimleri
- `VoiceParticipants.tsx`: Konuşan kullanıcılarda ses dalgası animasyonu (CSS pulse)

---

### 7. v0.1.6 Sürüm Notları

- `changelogData.ts` ve `ReleaseNotesModal.tsx` güncelle

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| **SQL Migration** | `is_locked` sütunu, `timeout_until` sütunu, `server_bans` tablosu + RLS |
| `src/utils/botCommands.ts` | **YENİ** — Komut parser ve yürütücü |
| `src/components/SlashCommandPopup.tsx` | **YENİ** — `/` autocomplete popup |
| `src/pages/Index.tsx` | `handleSendMessage`'da komut algılama, `is_locked` kontrolü, `DbChannel` güncelle |
| `src/components/ChatArea.tsx` | Bot mesaj UI, kanal kilit UI, slash popup entegrasyonu |
| `src/hooks/useVoiceChannel.ts` | Hata yönetimi, retry, toast bildirimleri |
| `src/components/VoiceParticipants.tsx` | Ses dalgası animasyonu |
| `src/data/changelogData.ts` | v0.1.6 notları |
| `src/components/ReleaseNotesModal.tsx` | Versiyon güncelle |

