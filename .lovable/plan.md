

## Plan: Changelog Kaydırma + Ayarlar Geliştirme + Sunucu Fotoğraf Hatası

### 1. Changelog Kaydırma Sorunu

**Kök neden:** `src/index.css` satır 66-68'de `body` elementine `overflow: hidden`, `position: fixed`, `height: 100%` uygulanmış. Bu, Index (sohbet) sayfası için gerekli ama Changelog gibi bağımsız sayfalarda kaydırmayı tamamen engelliyor.

**Çözüm:** `body`'deki `overflow: hidden` ve `position: fixed` stillerini kaldır. Bunun yerine bu kısıtlamayı sadece ihtiyaç duyan sayfalarda (Index, Settings) uygula. Changelog ve ChangelogDetail sayfaları `min-h-screen` ile doğal kaydırma kullanacak.

Alternatif olarak, `#root`'a `overflow-y-auto` ekleyip Changelog sayfalarına `overflow-y-auto` wrapper eklemek de çözüm olabilir. Ama en temizi `body`'den `position: fixed` ve `overflow: hidden`'ı kaldırıp, Index.tsx gibi sayfaların kendi container'larında `h-screen overflow-hidden` kullanmasını sağlamak.

### 2. Sunucu Fotoğrafı Yükleme Hatası

**Kök neden:** Storage RLS politikası `auth.uid()::text = storage.foldername(name)[1]` kontrolü yapıyor — yani dosya yolundaki ilk klasör adının kullanıcı ID'si olmasını bekliyor. Ancak `ServerSettingsDialog.tsx` satır 114'te yol `${serverId}/icon.${ext}` olarak oluşturuluyor. `serverId` ≠ `userId` olduğu için RLS reddiyor.

**Çözüm:** Upload yolunu `${user.id}/servers/${serverId}/icon.${ext}` olarak değiştir. Böylece klasör adı kullanıcı ID'siyle eşleşecek ve RLS geçecek. Ayrıca `useAuth`'tan `user`'ı zaten alıyoruz, ek prop gerekmez.

### 3. Ayarlar Sayfası Geliştirmeleri

Mevcut durumda "Hesabım" sekmesi sadece bilgileri gösteriyor, düzenleme yok. Eklenecekler:

- **Görünen ad düzenleme:** Inline edit butonu ile `display_name` güncellenebilir
- **Kullanıcı adı düzenleme:** Inline edit butonu ile `username` güncellenebilir  
- **E-posta gösterimi:** Kullanıcının e-posta adresini (auth'tan) salt okunur olarak göster
- **Hesap oluşturma tarihi:** `profile.created_at` gösterimi

### Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| `src/index.css` | `body`'den `overflow: hidden`, `position: fixed`, `height/width: 100%` kaldır |
| `src/pages/Index.tsx` | Container'a `h-screen overflow-hidden` zaten var, değişiklik yok |
| `src/pages/Settings.tsx` | `h-screen overflow-hidden` ekle (kendi scroll'u var). Hesap sekmesine ad/kullanıcı adı düzenleme, e-posta ve tarih ekleme |
| `src/components/ServerSettingsDialog.tsx` | Upload path'i `${user.id}/servers/${serverId}/icon.${ext}` yap |
| `src/pages/Changelog.tsx` | `overflow-y-auto` wrapper ekle (body fix sonrası otomatik çalışacak ama güvenlik için) |
| `src/pages/ChangelogDetail.tsx` | Aynı şekilde `overflow-y-auto` wrapper |

### Teknik Detaylar

**Storage path değişikliği:**
```
Eski: ${serverId}/icon.${ext}        → RLS FAIL (foldername ≠ userId)
Yeni: ${user.id}/servers/${serverId}/icon.${ext}  → RLS PASS (foldername = userId)
```

**Body CSS değişikliği:**
```css
/* Eski */
body { overflow: hidden; position: fixed; width: 100%; height: 100%; }

/* Yeni */
body { /* sadece font ve renk */ }
#root { width: 100%; height: 100%; }
```

Sayfa bazlı kontrol: Index.tsx ve Settings.tsx zaten `h-screen` kullanıyor, kendi overflow'larını yönetiyorlar.

