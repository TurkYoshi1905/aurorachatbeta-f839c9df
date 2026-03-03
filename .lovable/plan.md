

## Plan: DM Realtime Kesin Çözüm — Sunucu Kalıbıyla Birebir Eşleştirme

### Kök Neden Analizi

Sunucu mesajları ile DM mesajları arasındaki kritik farklar:

| | Sunucu (Çalışıyor) | DM (Çalışmıyor) |
|---|---|---|
| Event dinleme | Ayrı `.on()` çağrıları: INSERT, UPDATE, DELETE | Tek `event: '*'` — bazı Supabase sürümlerinde güvenilmez |
| Dependency array | `[]` — kanal asla yeniden oluşturulmaz | `[user, dmUserId, dmDisplayName, dmAvatarUrl]` — profil değişince kanal yıkılıp yeniden yaratılıyor |
| Filtreleme | `serverRef.current` ve `channelRef.current` (ref) | Doğrudan state/prop kullanımı |

**Sonuç:** DM kanalı, `dmDisplayName` veya `dmAvatarUrl` değiştiğinde (profil sync tetiklendiğinde) yıkılıp yeniden oluşturuluyor. Bu geçiş sırasında event'ler kayboluyor. Ayrıca `event: '*'` bazı durumlarda event'leri düşürebiliyor.

### Düzeltme Planı

#### 1. `src/components/DMChatArea.tsx` — Realtime Subscription Refaktörü

**Değişiklikler:**
- `dmUser.userId`, `dmUser.displayName`, `dmUser.avatarUrl` ve `user.id` değerlerini **ref**'lere kaydet (sunucudaki `channelRef`/`serverRef` kalıbı)
- `event: '*'` yerine **ayrı `.on()` çağrıları** kullan: INSERT, UPDATE, DELETE
- Dependency array'i `[user?.id, dmUser.userId]` olarak daralt — sadece konuşma çifti değiştiğinde kanal yeniden oluşturulacak
- `subscribe()` callback'ine `SUBSCRIBED` log'u ekle (bağlantı doğrulaması için)
- Typing broadcast'lerde de ref kullan

```text
ÖNCE (Bozuk):
  useEffect deps: [user, dmUserId, dmDisplayName, dmAvatarUrl]
  .on('postgres_changes', { event: '*', ... })  ← tek handler

SONRA (Düzeltilmiş):
  useEffect deps: [user?.id, dmUser.userId]      ← minimal
  .on(INSERT, ...)                                ← ayrı handler
  .on(UPDATE, ...)                                ← ayrı handler  
  .on(DELETE, ...)                                ← ayrı handler
  Filtreleme: dmUserIdRef.current (ref)           ← kanal yeniden oluşturulmaz
```

#### 2. `src/data/changelogData.ts` — v0.0.9 Kontrolü

Zaten mevcut — değişiklik gerekmez.

### Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| `src/components/DMChatArea.tsx` | Ref'lerle filtreleme, ayrı event listener'lar, minimal deps |

