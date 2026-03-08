

## Plan: v0.1.9 — Reply + Pin + Kullanıcı Profil Kartı

---

### 1. Veritabanı: `messages` tablosuna `reply_to` ve `is_pinned` sütunları ekle

**Migration SQL:**
```sql
ALTER TABLE public.messages ADD COLUMN reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
```

- `reply_to`: yanıtlanan mesajın ID'si (null = yanıt değil)
- `is_pinned`: sabitlenen mesajları işaretler
- Pin/unpin için sunucu sahiplerine UPDATE izni zaten var (mevcut RLS yeterli, sadece `is_pinned` güncellenir)

### 2. Mesaj Yanıtlama (Reply)

**ChatArea.tsx:**
- Yeni state: `replyingTo: DbMessage | null`
- Mesaj hover aksiyonlarına "Yanıtla" butonu ekle (Reply ikonu)
- Input alanının üstüne yanıt önizlemesi göster: `"@Kullanıcı: mesaj içeriği..."` + iptal butonu
- `onSendMessage` callback'ine `replyTo?: string` parametresi ekle
- Mesaj gönderilirken `reply_to` sütununa yanıtlanan mesaj ID'si yazılsın

**Index.tsx:**
- `handleSendMessage` fonksiyonuna `replyTo` parametresi ekle
- Insert sırasında `reply_to` alanını gönder
- Mesaj fetch'inde reply_to'yu da çek

**ChatArea.tsx mesaj render:**
- `msg.replyTo` varsa mesajın üstünde küçük bir referans göster: `"↩ @Kullanıcı mesaj..."` (tıklanınca orijinal mesaja scroll)

**DbMessage interface güncellemesi:**
```typescript
replyTo?: string;
replyAuthor?: string;
replyContent?: string;
```

### 3. Mesaj Sabitleme (Pin)

**ChatArea.tsx:**
- Mesaj hover aksiyonlarına "Sabitle/Kaldır" butonu ekle (sadece `isOwner` ise görünür)
- Üst barda Pin ikonuna tıklanınca sabitlenmiş mesajları gösteren bir Popover/Sheet aç
- `onPinMessage(messageId: string)` ve `onUnpinMessage(messageId: string)` callback'leri

**Index.tsx:**
- `handlePinMessage`: `supabase.from('messages').update({ is_pinned: true }).eq('id', messageId)`
- `handleUnpinMessage`: `is_pinned: false`
- Sabitlenmiş mesajları filtrelemek için `messages.filter(m => m.isPinned)`

**DbMessage interface:**
```typescript
isPinned?: boolean;
```

### 4. Kullanıcı Profil Kartı

**Yeni bileşen: `src/components/UserProfileCard.tsx`**
- Bir kullanıcıya tıklandığında açılan Popover/Dialog
- İçerik: Avatar (büyük), görünen ad, kullanıcı adı, rol rozeti, katılım tarihi, durum
- Veriler `profiles` tablosundan ve `server_members` (joined_at) + `server_member_roles`/`server_roles` tablolarından çekilir

**Entegrasyon noktaları:**
- `ChatArea.tsx`: Mesaj yazarının adına tıklayınca profil kartı aç
- `MemberList.tsx`: Üye listesinde bir üyeye tıklayınca profil kartı aç

### 5. Sürüm Notları

**changelogData.ts** ve **ReleaseNotesModal.tsx**: v0.1.9 güncelle

**i18n**: 6 dile yeni anahtarlar (reply, pin, unpin, profileCard vb.)

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| **SQL Migration** | `reply_to` uuid + `is_pinned` boolean sütunları |
| `src/pages/Index.tsx` | DbMessage güncelle, reply_to/is_pinned fetch & send, pin/unpin handlers |
| `src/components/ChatArea.tsx` | Reply UI (önizleme + referans), Pin butonu, Pinned mesajlar paneli |
| `src/components/UserProfileCard.tsx` | **YENİ** — Profil kartı popover bileşeni |
| `src/components/MemberList.tsx` | Üye tıklama → profil kartı |
| `src/data/changelogData.ts` | v0.1.9 notları |
| `src/components/ReleaseNotesModal.tsx` | Versiyon güncelle |
| `src/i18n/*.ts` | Yeni çeviri anahtarları (6 dil) |

