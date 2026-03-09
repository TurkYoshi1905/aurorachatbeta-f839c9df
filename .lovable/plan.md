

## Plan: Kullanıcı Profil Kartı Durum Güncellemesi + v0.2.8

### Problem
`ChatArea.tsx` satır 419'da `UserProfileCard` bileşenine `status` prop'u geçirilmiyor. `members` verisi mevcut ama kullanıcının durumu kartına aktarılmıyor — bu yüzden profil kartı her zaman "offline" gösteriyor.

### Çözüm

**1. `src/components/ChatArea.tsx`**
- `UserProfileCard` kullanılan yerde (satır 419), `members` dizisinden `msg.userId`'ye göre durumu bulup `status` prop'u olarak geçir:
  ```tsx
  <UserProfileCard userId={msg.userId} serverId={serverId} status={members.find(m => m.id === msg.userId)?.status}>
  ```

**2. `src/components/ReleaseNotesModal.tsx`**
- `CURRENT_VERSION = '0.2.8'`
- Notları güncelle: profil kartı durum düzeltmesi

**3. `src/data/changelogData.ts`**
- v0.2.8 girişi ekle

| Dosya | Değişiklik |
|---|---|
| `src/components/ChatArea.tsx` | UserProfileCard'a members'dan status prop'u ekle |
| `src/components/ReleaseNotesModal.tsx` | v0.2.8 |
| `src/data/changelogData.ts` | v0.2.8 sürüm notu |

