

## Plan: Mobil Arama & Bildirim Butonlarına İşlevsellik Ekleme

### Problem
`Index.tsx` satır 1151-1178'deki mobil `ChatArea` render'ında `onToggleSearch` ve `onToggleNotifications` prop'ları geçirilmiyor. Butonlar var ama tıklayınca hiçbir şey olmuyor.

Masaüstünde search ve notification panelleri yan panel olarak açılıyor. Mobilde bu yan paneller sığmaz — Sheet (alt sayfa) olarak açılmalı.

### Çözüm

**Dosya: `src/pages/Index.tsx`**

1. Mobil `ChatArea`'ya eksik prop'ları ekle:
   - `onToggleSearch` → `showSearchPanel` state'ini toggle et
   - `onToggleNotifications` → `showNotificationPanel` state'ini toggle et

2. Mobil render bloğuna iki yeni `Sheet` ekle:
   - **Arama Sheet:** `showSearchPanel` true ise açılır, `MessageSearchPanel` bileşenini içerir, `side="bottom"`, `h-[85dvh]`
   - **Bildirim Sheet:** `showNotificationPanel` true ise açılır, `NotificationPanel` bileşenini içerir, aynı stil

### Değişiklik Detayı

```
// Satır ~1177'ye ekle:
onToggleSearch={() => setShowSearchPanel(p => !p)}
onToggleNotifications={() => setShowNotificationPanel(p => !p)}
```

Thread Sheet'inden sonra iki yeni Sheet bloğu eklenir (satır ~1198 civarı).

| Dosya | Değişiklik |
|---|---|
| `src/pages/Index.tsx` | Mobil ChatArea'ya onToggleSearch/onToggleNotifications ekle + 2 Sheet ekle |

