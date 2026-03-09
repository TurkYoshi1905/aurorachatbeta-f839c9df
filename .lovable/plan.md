

## Plan: Bildirim İzni İsteme — Kullanıcıya Açıklayıcı UI ile İzin Talebi

### Problem
Mevcut kod (`Index.tsx` satır 188-192) sayfa yüklendiğinde sessizce `Notification.requestPermission()` çağırıyor. Tarayıcılar bunu genellikle engelliyor çünkü kullanıcı etkileşimi olmadan çağrılıyor. Ayrıca kullanıcıya neden izin istediğini açıklamıyor.

### Çözüm
Bir in-app banner/dialog göster: "Etiketlendiğinde veya mesaj aldığında bildirim almak ister misin?" — kullanıcı "Evet" derse `Notification.requestPermission()` çağır, "Hayır" derse `localStorage`'a kaydet ve bir daha gösterme.

### Değişiklikler

**1. Yeni Bileşen: `src/components/NotificationPermissionBanner.tsx`**
- `Notification.permission === 'default'` ve `localStorage.getItem('notification_permission_dismissed') !== 'true'` ise göster
- Sayfanın altında veya üstünde küçük bir banner: Bell ikonu + "Bildirimleri aç" açıklaması + "İzin Ver" / "Hayır" butonları
- "İzin Ver" → `Notification.requestPermission()` çağır, sonuca göre toast göster
- "Hayır" → `localStorage.setItem('notification_permission_dismissed', 'true')`, banner'ı kapat
- İzin zaten `granted` veya `denied` ise hiç gösterme

**2. `src/pages/Index.tsx`**
- Mevcut sessiz `requestPermission` useEffect'ini kaldır (satır 187-192)
- `NotificationPermissionBanner` bileşenini render et
- Mention bildirim kodundaki (satır 415-420) `permission === 'default'` kontrolünü koru (fallback)

| Dosya | Değişiklik |
|---|---|
| `src/components/NotificationPermissionBanner.tsx` | **Yeni** — Açıklayıcı bildirim izni banner'ı |
| `src/pages/Index.tsx` | Sessiz requestPermission kaldır, banner bileşenini ekle |

