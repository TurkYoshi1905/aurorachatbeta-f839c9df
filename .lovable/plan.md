

## Plan: DM Realtime Mesajlaşma Düzeltmesi

### Analiz Sonucu

Kodu ve veritabanı yapılandırmasını inceledim:
- `direct_messages` tablosu Realtime publication'da **mevcut** ✅
- REPLICA IDENTITY FULL ayarlı ✅
- RLS SELECT politikası doğru (`sender_id` veya `receiver_id` eşleşmesi) ✅
- Optimistic UI ve mesaj gönderme mantığı doğru ✅

**Kök neden:** `DMChatArea.tsx`'deki Realtime subscription'da `filter` parametresi kullanılmıyor. Tüm `direct_messages` INSERT olayları dinleniyor ve client-side filtreleniyor. Supabase Realtime, filtre olmadan RLS kontrolünü her satır için yapması gerekiyor ki bu bazen olayların gecikmesine veya tamamen düşmesine neden olabiliyor. Server mesajlarında bu sorun yaşanmıyor çünkü `server_members` tablosu üzerinden RLS daha basit bir yapıda.

### Çözüm

**`src/components/DMChatArea.tsx` — Realtime subscription güncelleme:**

1. Subscription'a `filter: receiver_id=eq.${user.id}` ekle — böylece Supabase Realtime sadece kullanıcının alıcı olduğu mesajları gönderir, RLS kontrolü basitleşir
2. Kendi mesajları zaten optimistic olarak ekleniyor, filtre sadece `receiver_id` ile çalışınca `sender_id === user.id` kontrolüne gerek kalmaz
3. Subscription status kontrolünü iyileştir — `SUBSCRIBED` durumunu logla, hata durumunda yeniden bağlanma (retry) mekanizması ekle
4. Client-side `isRelevant` filtresini koru (güvenlik katmanı olarak) — sadece bu iki kullanıcı arasındaki mesajlar gösterilsin

### Değişiklik Detayı

Tek dosya: `src/components/DMChatArea.tsx`

```typescript
// Eski (satır 86-88):
.on(
  'postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'direct_messages' },

// Yeni:
.on(
  'postgres_changes',
  { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'direct_messages',
    filter: `receiver_id=eq.${user.id}` 
  },
```

Bu değişiklik Supabase Realtime sunucusunun sadece ilgili satırları göndermesini sağlar. Ayrıca subscribe callback'ine `SUBSCRIBED` ve `TIMED_OUT` durumları eklenerek bağlantı durumu izlenir.

