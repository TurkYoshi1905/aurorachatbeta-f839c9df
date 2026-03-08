

## Plan: v0.2.3 — Mobil Menü Başlığı, Bildirim İzni, Boşta Durumu & Tarih Lokalizasyonu

### 1. Mobil Mesaj Menüsü Başlığı Düzeltmesi

**Problem:** `t('chat.messageActions')` çeviri anahtarı mevcut değil, bu yüzden ham anahtar gösteriliyor.

**Çözüm:**
- `ChatArea.tsx` satır 517: Fallback yerine doğrudan `t('chat.messageActions')` kullan
- Tüm i18n dosyalarına (`tr.ts`, `en.ts`, `az.ts`, `ru.ts`, `ja.ts`, `de.ts`) `chat.messageActions` anahtarını ekle
  - TR: `'Mesaj İşlemleri'`, EN: `'Message Actions'`, vb.

### 2. Bildirim İzni

**Çözüm:** `Index.tsx` içinde uygulama yüklendiğinde `Notification.requestPermission()` çağır:
```typescript
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

### 3. Boşta (Idle) Durumu — Ay İkonu

**Problem:** UserInfoPanel ve MemberList'te idle durumu sarı nokta olarak gösteriliyor, ay ikonu olması lazım.

**Çözüm:**
- **UserInfoPanel.tsx** satır 81: Status indicator dot'u bir bileşene çevir — idle ise `Moon` SVG ikonu, diğerleri için mevcut renkli nokta
- **MemberList.tsx** satır 44: Aynı şekilde idle durumunda ay ikonu göster
- Ortak bir `StatusIndicator` bileşeni oluştur veya inline render et

### 4. Arka Plan Boşta Algılama

**Çözüm:** `Index.tsx`'te `visibilitychange` event listener ekle:
- Sayfa gizlenince (`document.hidden`) durumu `'idle'` yap (önceki durumu kaydet)
- Sayfa tekrar görünür olunca önceki duruma geri dön
- Sadece kullanıcı durumu `'online'` ise idle'a çevir (dnd/invisible ise dokunma)

### 5. Profil Kartı Tarih Lokalizasyonu

**Problem:** `format(date, 'dd MMM yyyy')` her zaman İngilizce ay isimleri gösteriyor.

**Çözüm:** `UserProfileCard.tsx`'te `date-fns` locale'leri kullan:
```typescript
import { tr, enUS, az, ru, ja, de } from 'date-fns/locale';
const localeMap = { tr, en: enUS, az, ru, ja, de };
format(date, 'dd MMMM yyyy', { locale: localeMap[language] })
```
`useTranslation()` hook'undan `language` al.

### 6. Profil Kartında Gerçek Zamanlı Durum

**Çözüm:** `UserProfileCard.tsx`'te kullanıcının presence durumunu göster. Members listesinden veya realtime presence'tan status bilgisini çek ve profil kartında göster.

### 7. v0.2.3 Sürüm Yayını

- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.2.3'`, notları güncelle
- `changelogData.ts`: v0.2.3 ekle

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/i18n/tr.ts`, `en.ts`, `az.ts`, `ru.ts`, `ja.ts`, `de.ts` | `chat.messageActions` anahtarı ekle |
| `src/components/ChatArea.tsx` | `as any` cast'i kaldır |
| `src/pages/Index.tsx` | Bildirim izni + arka plan idle algılama |
| `src/components/UserInfoPanel.tsx` | Idle durumunda ay ikonu göster (indicator dot) |
| `src/components/MemberList.tsx` | Idle durumunda ay ikonu göster |
| `src/components/UserProfileCard.tsx` | Tarih lokalizasyonu + gerçek zamanlı durum gösterimi |
| `src/components/ReleaseNotesModal.tsx` | v0.2.3 |
| `src/data/changelogData.ts` | v0.2.3 sürüm notları |

