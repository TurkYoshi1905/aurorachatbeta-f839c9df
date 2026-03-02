

## Sorun Analizi ve Cozum Plani

### Sorun 1: Emoji Tepkileri Gercek Zamanli Guncellenmiyor

**Temel Neden:** `handleToggleReaction` fonksiyonu veritabanina istek gonderip cevap bekliyor ama UI'yi hemen guncellemiyor. Realtime listener calisiyor olsa bile, `INSERT` handler'inda mevcut nesne dogrudan mutate ediliyor (immutable update yapilmiyor), bu da React'in degisikligi algilamamasina neden oluyor.

**Cozum:**
- `handleToggleReaction` icine **optimistik UI guncellemesi** eklenecek — veritabanina istek gitmeden once reactions state'i hemen guncellenecek
- Realtime INSERT handler'inda `existing` nesnesi mutate edilmek yerine yeni bir nesne olusturulacak (spread operator ile)
- Hata durumunda optimistik guncelleme geri alinacak

### Sorun 2: Kullanici Statusu "Cevrimdisi" Olarak Gorunuyor

**Temel Neden:** `fetchMembers` fonksiyonu her calistiginda tum uyelerin statusunu `'offline'` olarak sifirliyor (satir 142). Presence verisi ayri bir kanalda tutuluyor ve `fetchMembers` calistiktan sonra presence sync event'i tekrar tetiklenmeyebiliyor, bu da statusun kaybolmasina neden oluyor.

**Cozum:**
- `fetchMembers` icinde status'u her zaman `'offline'` yapmak yerine, mevcut `members` state'indeki status degerini koruyacak sekilde guncelleme yapilacak
- Ilk yukleme sirasinda presence state'i henuz gelmemisse `'offline'` kalacak, ancak sonraki fetchMembers cagrilarinda mevcut presence bilgisi korunacak

### Teknik Degisiklikler

**Dosya: `src/pages/Index.tsx`**

1. **`fetchMembers` duzeltmesi (satir 134-144):** Mevcut uyelerin status bilgisini koruyacak sekilde guncelleme:
```typescript
setMembers((prevMembers) => {
  const statusMap = new Map(prevMembers.map(m => [m.id, m.status]));
  return data.map((p) => ({
    id: p.user_id,
    name: p.display_name,
    avatar: p.display_name?.charAt(0)?.toUpperCase() || '?',
    avatarUrl: p.avatar_url || null,
    status: statusMap.get(p.user_id) || 'offline',
  }));
});
```

2. **`handleToggleReaction` optimistik guncelleme (satir 366-387):** Veritabanina istek gitmeden once UI'yi hemen guncelleyecek:
```typescript
// Once state'i hemen guncelle (optimistik)
setReactions(prev => { ... guncellenmis reactions ... });
// Sonra veritabanina istek gonder
const { error } = await supabase...;
// Hata varsa geri al
if (error) setReactions(oncekiState);
```

3. **Realtime reactions INSERT handler duzeltmesi (satir 328-333):** Mevcut nesneyi mutate etmek yerine yeni nesne olusturma:
```typescript
if (existing) {
  // Mutate yerine spread ile yeni nesne
  const updated = {
    ...existing,
    userIds: [...existing.userIds, r.user_id],
    count: existing.count + 1
  };
  list[list.indexOf(existing)] = updated;
}
```

