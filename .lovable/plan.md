

## Plan: v0.1.8 — Kayıt Yenileme, Şifre Sıfırlama, Emoji Fix, 2FA UI, Gizlilik Güncellemesi

---

### 1. Çok Adımlı Kayıt: Doğum Tarihi + Profil Fotoğrafı

**Register.tsx** — Mevcut 3 adımı 5 adıma genişlet:

```text
names → birthday → avatar → password → email
```

**Adım: birthday**
- Gün/Ay/Yıl select dropdown'ları
- Yaş hesaplama: `now - birthDate`. 13 yaşından küçükse hata göster, ilerlemeyi engelle
- Doğum tarihi profiles tablosuna kaydedilmeyecek (sadece yaş doğrulaması)

**Adım: avatar**
- Dosya seçici + dairesel önizleme
- Kullanıcı atlamak isterse "Atla" butonu
- Seçilen dosya state'te tutulup, kayıt tamamlandığında `avatars` bucket'ına yüklenecek

**Stepper bar** 3'ten 5 adıma güncelle.

### 2. Şifremi Unuttum & Şifre Sıfırlama

**Login.tsx**: "Şifremi Unuttum" linki ekle → `/forgot-password`

**Yeni sayfa: `src/pages/ForgotPassword.tsx`**
- E-posta input + gönder butonu
- `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`

**Yeni sayfa: `src/pages/ResetPassword.tsx`**
- URL hash'ten `type=recovery` kontrol et
- Yeni şifre + onay inputları
- `supabase.auth.updateUser({ password })`

**App.tsx**: `/forgot-password` (PublicRoute) ve `/reset-password` (public, auth gerektirmez) rotaları ekle.

### 3. Emoji Arama Fix

**EmojiPicker.tsx**: Mevcut search mantığı sadece tüm emojileri gösteriyor (arama filtrelemiyor). Her emojiye keyword/tag eşleştirmesi ekle (basit bir map) ve `search` değerine göre filtrele.

### 4. Bildirim Sistemi (@mention)

**ChatArea.tsx / Index.tsx**: Kullanıcı `@mention` ile etiketlendiğinde:
- `Notification.requestPermission()` ile izin iste
- `new Notification(...)` ile masaüstü/mobil bildirimi gönder
- Uygulama arka plandayken de çalışır (browser Notification API)

### 5. 2FA UI (Settings Privacy)

**Settings.tsx**: Mevcut `disabled` 2FA butonunu aktif hale getir:
- Tıklandığında e-posta tabanlı OTP doğrulaması başlat
- `supabase.auth.mfa.enroll({ factorType: 'totp' })` ile TOTP QR kodu göster
- Kullanıcı OTP girip doğrula → `supabase.auth.mfa.challengeAndVerify()`
- Basit bir dialog/modal içinde QR + 6 haneli input

### 6. Gizlilik Politikası Güncelleme

**PrivacyPolicy.tsx**: Yaş sınırı (+13), bildirim izinleri ve veri güvenliği maddelerini ekle.

### 7. v0.1.8 Sürüm Notları

**changelogData.ts** ve **ReleaseNotesModal.tsx** güncelle.

### 8. i18n Anahtarları

Tüm 6 dile (tr, en, ru, ja, de, az) yeni anahtarlar ekle:
- `auth.stepBirthday`, `auth.stepAvatar`, `auth.ageRestriction`, `auth.forgotPassword`, `auth.resetPassword`, `auth.newPassword`, `auth.skipStep`, vb.

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/pages/Register.tsx` | 5 adımlı kayıt, doğum tarihi + avatar adımları |
| `src/pages/Login.tsx` | "Şifremi Unuttum" linki |
| `src/pages/ForgotPassword.tsx` | **YENİ** — E-posta ile şifre sıfırlama isteği |
| `src/pages/ResetPassword.tsx` | **YENİ** — Yeni şifre belirleme |
| `src/App.tsx` | Yeni rotalar ekle |
| `src/components/EmojiPicker.tsx` | Arama algoritmasını düzelt (keyword eşleştirme) |
| `src/pages/Index.tsx` | @mention bildirim tetikleme |
| `src/pages/Settings.tsx` | 2FA TOTP enrollment UI |
| `src/pages/PrivacyPolicy.tsx` | Yaş sınırı, bildirim, güvenlik maddeleri |
| `src/data/changelogData.ts` | v0.1.8 notları |
| `src/components/ReleaseNotesModal.tsx` | Versiyon güncelle |
| `src/i18n/*.ts` | Yeni çeviri anahtarları (6 dil) |

