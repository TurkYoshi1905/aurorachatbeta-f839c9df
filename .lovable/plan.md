

## Plan: Discord Tarzı Medya Yükleme + DM Real-time Kesin Çözüm

### 1. DM Real-time Kök Neden Analizi

Mevcut DM subscription kodu (DMChatArea.tsx satır 62-87) yapısal olarak doğru görünüyor - INSERT/UPDATE/DELETE handler'ları, ref-based filtering, cleanup hepsi mevcut. Ancak iki potansiyel sorun var:

**Sorun A**: `postgres_changes` subscription'da `filter` parametresi kullanılmıyor. Tüm `direct_messages` değişiklikleri dinleniyor ve client-side filtreleniyor. Bu, Supabase Realtime'ın yoğun trafikte event'leri geciktirmesine veya kaçırmasına neden olabilir.

**Sorun B**: Typing kanalı (`dm-typing-${pairKey}`) ayrı bir channel olarak oluşturuluyor ama `sendTypingEvent` fonksiyonu (satır 106) `supabase.channel(...)` ile yeni referans alıyor — bu, subscribe edilmemiş bir kanal üzerinden broadcast göndermeye çalışıyor olabilir ve internal channel map'i bozabilir.

**Kesin Çözüm**:
- DM realtime subscription'a server-side filter ekle: `filter: 'sender_id=eq.${userId}'` veya OR filtresi (Supabase OR filter desteklemediği için iki ayrı subscription kullan)
- Alternatif olarak mevcut filtresiz yapıyı koruyup, subscription status tracking ve otomatik resubscribe mekanizması güçlendir
- Typing channel referansını useRef ile sakla, broadcast gönderiminde bu ref'i kullan

### 2. Medya Yükleme Sistemi

#### Veritabanı Değişiklikleri
- `messages` tablosuna `attachments text[]` kolonu ekle (URL array, nullable, default NULL)
- `direct_messages` tablosuna `attachments text[]` kolonu ekle
- `message_attachments` adında public storage bucket oluştur
- Bucket için RLS: authenticated kullanıcılar upload edebilir, herkes okuyabilir

#### Storage Yapısı
```
message_attachments/
  {userId}/channels/{messageId}/image1.jpg
  {userId}/dm/{messageId}/image2.jpg
```

#### Chat UI Değişiklikleri

**ChatArea.tsx & DMChatArea.tsx**:
- `PlusCircle` butonuna file input bağla (accept="image/*", multiple, max 3)
- Seçilen dosyaları önizleme olarak mesaj kutusunun üstünde thumbnail grid'de göster
- 5MB sınır kontrolü client-side
- Gönderimde: dosyaları storage'a yükle → URL'leri al → mesajı attachments ile kaydet

**Mesaj Görüntüleme**:
- Attachments varsa mesaj içeriğinin altında grid layout (1 resim: tam genişlik, 2: yan yana, 3: 2+1 grid)
- Resimlere tıklanınca lightbox (Dialog ile tam ekran overlay, zoom)
- Resim yükleme hatası için fallback placeholder

#### Lightbox Bileşeni
- Yeni `ImageLightbox.tsx` bileşeni: Dialog tabanlı, tam ekran resim görüntüleme
- Sol/sağ ok tuşları ile galeri içinde gezinme
- İndirme butonu

### 3. Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| SQL Migration | `attachments text[]` kolonu messages + direct_messages, `message_attachments` bucket + RLS |
| `src/components/ChatArea.tsx` | File upload UI, attachment grid render, lightbox entegrasyonu |
| `src/components/DMChatArea.tsx` | File upload UI, attachment grid render, DM realtime fix (typing ref) |
| `src/components/ImageLightbox.tsx` | Yeni: tam ekran resim görüntüleyici |
| `src/components/MessageAttachments.tsx` | Yeni: attachment grid bileşeni (paylaşılan) |
| `src/components/FileUploadPreview.tsx` | Yeni: seçilen dosyaların önizleme strip'i |
| `src/pages/Index.tsx` | DbMessage'a attachments ekle, handleSendMessage'da upload desteği |
| `src/i18n/*.ts` | Yeni anahtarlar (upload, lightbox, DM) |

### 4. i18n Anahtarları
- `chat.attachImage` / `chat.maxFiles` / `chat.fileTooLarge` / `chat.uploading`
- `dm.attachImage` / `dm.maxFiles` / `dm.fileTooLarge` / `dm.uploading`

