

## Plan: DM Realtime Kesin Cozum, Profil Sync Dogrulama, v0.0.9 Changelog

### Analiz Sonuclari

- `direct_messages` tablosu realtime publication'da **mevcut**
- Replica identity **FULL** — DELETE event'leri eski satiri icerir
- RLS politikalari dogru: `sender_id = auth.uid() OR receiver_id = auth.uid()` (SELECT)
- `AuthContext`'te profil sync realtime aboneligi **zaten calisiyor**

**Potansiyel DM Realtime Sorunlari:**
1. Subscribe callback'te hata kontrolu yok — baglanti basarisiz olursa sessizce devam ediyor
2. Kanal `subscribe()` sonucu kontrol edilmiyor (`SUBSCRIBED` vs `CHANNEL_ERROR`)
3. Typing kanali ile realtime kanali ayni `pairKey` kullanip farkli prefix kullaniyor — sorun olmamali ama karisiklik yaratabilir

### 1. DM Realtime Guclendirilmesi (`src/components/DMChatArea.tsx`)

Mevcut subscription yapisini koruyarak su iyilestirmeleri yap:

- `subscribe()` callback'ine status kontrolu ekle — `CHANNEL_ERROR` veya `TIMED_OUT` durumunda otomatik yeniden baglanma (retry) mantigi
- Channel subscription durumunu bir ref'te tut, component unmount olurken temizle
- INSERT handler'da optimistic mesaj ile gercek mesajin ID eslesme kontrolunu guclendir (tempId match)
- `event: '*'` tek bir listener kullanarak INSERT/UPDATE/DELETE'i tek handler'da isle — bu Supabase'in event filtering yukunu azaltir ve daha guvenilir

**Yeni yaklasim:**
```typescript
.on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
  if (payload.eventType === 'INSERT') { ... }
  else if (payload.eventType === 'UPDATE') { ... }
  else if (payload.eventType === 'DELETE') { ... }
})
.subscribe((status, err) => {
  if (status === 'CHANNEL_ERROR') console.error('DM channel error:', err);
})
```

### 2. Profil Senkronizasyonu

AuthContext'teki mevcut realtime profil sync **zaten calisiyor**. Ek islem gerekmez. DMChatArea'da mesajlardaki gosterim adi ve avatar, `profile` state'inden geliyor — profil degisince otomatik guncellenir.

### 3. v0.0.9 Changelog (`src/data/changelogData.ts`)

Dizinin basina yeni release ekle:

```
version: '0.0.9'
date: '3 Mart 2026'
summary: 'Tam gercek zamanli DM sistemi, profil senkronizasyonu ve gizlilik ozellikleri.'
sections:
  - Yeni Ozellikler:
    - Tam Gercek Zamanli DM Sistemi (Sayfa yenileme zorunlulugu kaldirildi)
    - Profil bilgilerinin (Ad/Kullanici adi) tum platformda anlik senkronizasyonu
    - DM Mesaj Duzenleme ve Silme ozellikleri eklendi
    - Yeni Gizlilik Politikasi sayfasi ve Geri Don butonu eklendi
  - Duzeltilen Hatalar:
    - Sunucu davet linklerindeki gorsel hatalari giderildi
    - Changelog navigasyon dongusu duzeltildi
  - Gelistirmeler:
    - Gizlilik ve Guvenlik ayarlari (DM izni, arkadaslik istekleri yonetimi, 2FA UI)
    - Sunucu ikonu render mantigi iyilestirildi
```

### 4. Dosya Degisiklikleri

| Dosya | Islem |
|---|---|
| `src/components/DMChatArea.tsx` | Realtime subscription'i `event: '*'` ile tek handler'a cevir, subscribe status kontrolu ekle |
| `src/data/changelogData.ts` | v0.0.9 release ekle |

