

## Plan: v0.2.6 — Mobil Arama & Bildirim, Premium Rozet, RGB Animasyon

### 1. Mobilde Filtreli Mesaj Arama & Bildirim Ayarları

**Problem:** `ChatArea.tsx` satır 344 ve 382'de `{!isMobile && (...)}` bloğu search ve notification butonlarını mobilde gizliyor.

**Çözüm:** Bu butonları `!isMobile` koşulunun dışına çıkar. Mobilde de Search, Bell ve Pin ikonları header'da görünsün. Bildirim ayarları popover'ı (`NotificationSettingsPopover`) ve mesaj arama paneli (`MessageSearchPanel`) zaten responsive — sadece tetikleme butonları eklenmeli.

**Dosya:** `src/components/ChatArea.tsx` — header'daki `!isMobile` koşullarını kaldır/düzenle.

---

### 2. Profiles Tablosuna `has_premium_badge` Kolonu

**DB Migration:**
```sql
ALTER TABLE profiles ADD COLUMN has_premium_badge boolean NOT NULL DEFAULT false;
```

Kullanıcının rozet durumunu buradan okuyacağız.

---

### 3. Premium Rozet — UserProfileCard & MemberList

- `UserProfileCard.tsx`: Profil verisini çekerken `has_premium_badge` de al. Display name yanına Crown/Zap ikonu ekle (altın rengi).
- `MemberList.tsx`: Üye adının yanına küçük premium rozet ikonu ekle (profil verisinden `has_premium_badge` kontrolü).
- `ProfileData` interface'ine `has_premium_badge: boolean` ekle.

**Dosyalar:** `UserProfileCard.tsx`, `MemberList.tsx`

---

### 4. Premium Sayfası RGB Animasyonlu Köşeler

`Settings.tsx`'teki Premium kartına (özellikle Premium plan kartına) CSS ile RGB/gökkuşağı animasyonlu border ekle. `index.css`'e keyframe tanımla:

```css
@keyframes rgb-border {
  0% { border-color: #ff0000; }
  33% { border-color: #00ff00; }
  66% { border-color: #0000ff; }
  100% { border-color: #ff0000; }
}
```

Premium kartına `animate-[rgb-border_3s_linear_infinite]` class'ı veya inline style uygula.

**Dosyalar:** `src/pages/Settings.tsx`, `src/index.css`

---

### 5. v0.2.6 Sürüm Notu

- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.2.6'`
- `changelogData.ts`: v0.2.6 girişi (mobil arama/bildirim, premium rozet, RGB animasyon)

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/components/ChatArea.tsx` | Search, Bell, Pin butonlarını mobilde de göster |
| `src/components/UserProfileCard.tsx` | `has_premium_badge` al, rozet göster |
| `src/components/MemberList.tsx` | Premium rozet ikonu |
| `src/pages/Settings.tsx` | Premium kartına RGB animasyonlu border |
| `src/index.css` | RGB border keyframe animasyonu |
| `src/components/ReleaseNotesModal.tsx` | v0.2.6 |
| `src/data/changelogData.ts` | v0.2.6 sürüm notları |
| **DB Migration** | `has_premium_badge` kolonu profiles tablosuna |

