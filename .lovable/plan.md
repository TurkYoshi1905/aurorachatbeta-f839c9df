

## Plan: DM + Sunucu Mesajları Gerçek Zamanlı Stabilizasyon & Optimistic UI

### Kök Neden Analizi

**DM Tarafı:**
- Realtime subscription yapısı zaten düzeltilmiş (ayrı INSERT/UPDATE/DELETE handler'lar, ref-based filtering, minimal deps). Ancak `direct_messages` tablosu `supabase_realtime` publication'a **eklenmemiş olabilir** — bu en kritik sebep.
- Optimistic update zaten var ama hata durumunda mesaj sessizce siliniyor, durum etiketi yok.

**Sunucu Kanal Tarafı:**
- `handleSendMessage` (Index.tsx satır 672) sadece `insert` yapıyor, optimistic update **yok** — mesaj yalnızca realtime INSERT event geldiğinde ekranda görünüyor. Bu gecikmeye neden oluyor.
- Realtime subscription (satır 247-313) doğru çalışıyor ama kendi gönderdiğimiz mesajları da tekrar ekliyor (duplicate riski).

### Değişiklikler

#### 1. Veritabanı: Realtime Publication Kontrolü

`direct_messages` tablosunu realtime publication'a ekle (eğer eksikse):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
```
Bu olmadan `postgres_changes` event'leri istemciye ulaşmaz.

#### 2. `src/pages/Index.tsx` — Sunucu Mesajları Optimistic UI

**`handleSendMessage`** fonksiyonunu güncelle:
- `insert` çağrısından önce mesajı geçici ID ile `messages` state'ine ekle
- `status: 'sending'` alanı ekle (yeni alan)
- Insert başarılıysa geçici ID'yi gerçek ID ile değiştir, status'u kaldır
- Insert başarısızsa status'u `'failed'` olarak işaretle
- Başarısız mesajlara "Tekrar Dene" butonu ekle

**Realtime INSERT handler** güncelle:
- Kendi gönderdiğimiz mesajları atla (`m.user_id === user?.id`) — optimistic update zaten eklemiş olacak

#### 3. `src/components/ChatArea.tsx` — Durum Etiketi UI

`DbMessage` interface'ine `status?: 'sending' | 'failed'` alanı ekle (Index.tsx'te).

Mesaj render'ında:
- `status === 'sending'` ise opacity-50 + "Gönderiliyor..." etiketi
- `status === 'failed'` ise kırmızı border + "Gönderilemedi — Tekrar Dene" butonu

#### 4. `src/components/DMChatArea.tsx` — Durum Etiketi UI

DM mesajlarına da aynı durum etiketini ekle:
- `DMMessage` interface'ine `status?: 'sending' | 'failed'` ekle
- `handleSend` fonksiyonunda hata durumunda `status: 'failed'` olarak güncelle (şu an siliniyor)
- "Tekrar Dene" butonu ekle

#### 5. Scroll Stabilizasyonu

Her iki bileşende de `scrollIntoView` çağrısını `requestAnimationFrame` ile sar — bazı tarayıcılarda layout hesaplaması tamamlanmadan scroll tetiklenebiliyor.

#### 6. i18n Anahtarları

Tüm dil dosyalarına yeni çeviri anahtarları ekle:
- `chat.sending` / `chat.failed` / `chat.retry`
- `dm.sending` / `dm.failed` / `dm.retry`

### Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| SQL Migration | `direct_messages` tablosunu realtime publication'a ekle |
| `src/pages/Index.tsx` | `handleSendMessage` optimistic update, INSERT handler duplicate koruması |
| `src/components/ChatArea.tsx` | `DbMessage` status alanı, durum etiketi render, tekrar dene butonu |
| `src/components/DMChatArea.tsx` | Hata durumunda status güncelleme, tekrar dene butonu, scroll fix |
| `src/i18n/tr.ts` | Yeni anahtarlar |
| `src/i18n/en.ts` | Yeni anahtarlar |
| `src/i18n/az.ts` | Yeni anahtarlar |
| `src/i18n/ru.ts` | Yeni anahtarlar |
| `src/i18n/ja.ts` | Yeni anahtarlar |
| `src/i18n/de.ts` | Yeni anahtarlar |

