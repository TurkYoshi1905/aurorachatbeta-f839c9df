

## Plan: Çok Dilli Destek (i18n) ve v0.1.0

### Yaklaşım

Lightweight bir i18n sistemi kuracağız — harici kütüphane (react-i18next vb.) kullanmadan, React Context + JSON çeviri dosyaları ile. Bu projenin boyutuna en uygun yaklaşım.

### Veritabanı Değişikliği

`profiles` tablosuna `language` sütunu ekle:
```sql
ALTER TABLE public.profiles ADD COLUMN language text NOT NULL DEFAULT 'tr';
```

### Dosya Yapısı

```text
src/
├── i18n/
│   ├── index.ts          — LanguageContext, useTranslation hook, provider
│   ├── tr.ts             — Türkçe çeviriler (default)
│   ├── en.ts             — İngilizce
│   ├── az.ts             — Azerbaycan
│   ├── ru.ts             — Rusça
│   ├── ja.ts             — Japonca
│   └── de.ts             — Almanca
```

### i18n Sistemi Tasarımı

1. **`LanguageProvider`** — `AuthContext`'ten `profile.language` değerini okur, ilgili dil dosyasını yükler
2. **`useTranslation()` hook** — `t('settings.account')` şeklinde çeviri döndürür
3. **Dil dosyaları** — nested obje yapısında, tüm UI metinlerini içerir:
   ```ts
   export default {
     settings: { account: 'My Account', privacy: 'Privacy', ... },
     chat: { typeMessage: 'Type a message', send: 'Send', ... },
     auth: { login: 'Login', register: 'Register', ... },
     // ...
   }
   ```

### Dil Değiştirme Mantığı

- Ayarlar sayfasına yeni bir **"Görünüm ve Dil"** sekmesi ekle (Globe ikonu)
- Dil listesi: Türkçe, English, Azərbaycan, Русский, 日本語, Deutsch
- Seçildiğinde `profiles.language` güncellenir, ardından `window.location.reload()`

### Güncellenecek Dosyalar (~15 dosya)

| Dosya | İşlem |
|---|---|
| `src/i18n/index.ts` | Context, provider, hook oluştur |
| `src/i18n/tr.ts` | Türkçe çeviriler (mevcut metinlerden) |
| `src/i18n/en.ts` | İngilizce çeviriler |
| `src/i18n/az.ts` | Azerbaycan çeviriler |
| `src/i18n/ru.ts` | Rusça çeviriler |
| `src/i18n/ja.ts` | Japonca çeviriler |
| `src/i18n/de.ts` | Almanca çeviriler |
| `src/App.tsx` | `LanguageProvider` sar |
| `src/contexts/AuthContext.tsx` | Profile interface'ine `language` ekle |
| `src/pages/Settings.tsx` | Yeni "Dil" sekmesi + tüm metinleri `t()` ile değiştir |
| `src/pages/Login.tsx` | Metinleri `t()` ile değiştir |
| `src/pages/Register.tsx` | Metinleri `t()` ile değiştir |
| `src/pages/Index.tsx` | Nav label'ları `t()` ile değiştir |
| `src/components/ChatArea.tsx` | Placeholder ve UI metinleri |
| `src/components/DMChatArea.tsx` | "yazıyor", placeholder metinleri |
| `src/components/DMDashboard.tsx` | Tab ve buton metinleri |
| `src/components/ChannelList.tsx` | Menü metinleri |
| `src/components/MemberList.tsx` | Başlık metinleri |
| `src/components/CreateServerDialog.tsx` | Dialog metinleri |
| `src/components/CreateChannelDialog.tsx` | Dialog metinleri |
| `src/components/ServerSettingsDialog.tsx` | Dialog metinleri |
| `src/components/InviteDialog.tsx` | Dialog metinleri |
| `src/components/JoinServerDialog.tsx` | Dialog metinleri |
| `src/data/changelogData.ts` | v0.1.0 release ekle |

### v0.1.0 Changelog İçeriği

- Çok Dilli Destek: Türkçe, İngilizce, Azerbaycan, Rusça, Japonca, Almanca
- Dil seçimi kullanıcı profiline kaydedilir
- Uygulama genelindeki tüm metinler dinamik hale getirildi

### Veritabanı Migrasyonu

`profiles` tablosuna `language` sütunu eklenmesi gerekecek (migration tool ile).

