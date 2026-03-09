

## Plan: v0.2.5 — Profil Kartı Düzeltmesi, Mobil Ayarlar Yeniden Tasarımı, Premium Sistemi, Dosya Ekleri

### 1. Profil Kartı Gerçek Zamanlı Durum Düzeltmesi

**Kök Neden:** `UserProfileCard.tsx` satır 97'de `supabase.channel('presence-room')` çağrısı yapılıyor ama bu, `Index.tsx`'teki orijinal presence kanalıyla (`config: { presence: { key: user.id } }`) çakışıyor. Supabase SDK'da aynı isimle ikinci bir kanal oluşturmak, presence verilerini düzgün almayı engelliyor.

**Çözüm:** `UserProfileCard`'ta ayrı bir kanal oluşturmak yerine, `Index.tsx`'te tutulan presence verilerini prop olarak veya global state üzerinden geçirmek gerekiyor. Ancak en pragmatik çözüm: `UserProfileCard`'taki presence effect'ini **benzersiz bir kanal adı** ile oluşturup sadece **subscribe** etmek (track yapmadan). Supabase presence kanalları aynı isimle paylaşılamaz.

Düzeltme: Kanalı `presence-room-card-${userId}` yerine, doğrudan `MemberList`'teki mevcut presence verisinden yararlanmak. `UserProfileCard`'a bir `status` prop'u ekleyip, açılan kartın durumunu dışarıdan almak.

**Dosya:** `src/components/UserProfileCard.tsx` — `status` prop eklenir, iç presence subscription kaldırılır. Çağrı noktalarında (`MemberList`, `ChatArea` vb.) status prop'u geçilir.

---

### 2. Mobil Sunucu Ayarları — Discord Tarzı Liste + Alt Sayfa

**Mevcut:** Üstte yatay kaydırmalı hamburger tab bar.

**Yeni:** Mobilde ana sayfa olarak dikey liste (Genel, Kanallar, Emojiler, Roller, Üyeler, Yasaklar, Denetim Kaydı, Tehlikeli Bölge). Bir öğeye tıklayınca, o sekmenin içeriği tam ekran açılır ve sol üstte geri butonu (← Geri) olur.

**Dosya:** `src/pages/ServerSettings.tsx` — Mobil görünümde `activeTab === null` ise liste göster, seçildiğinde alt sayfa göster + geri butonu.

---

### 3. Mobil Kullanıcı Ayarları — Aynı Desen

**Mevcut:** Üstte yatay kaydırmalı tab bar.

**Yeni:** Aynı dikey liste + alt sayfa deseni. Yeni sekmeler eklenir: `premium`.

**Dosya:** `src/pages/Settings.tsx` — Mobil görünümde liste + alt sayfa deseni.

---

### 4. AuroraChat Premium Sistemi

**UI-only (çalışmayan):** Ayarlar sayfasına `premium` sekmesi eklenir.

İki plan gösterilir:
- **AuroraChat Basic** — 10 TL/ay: Temel özellikler, özel profil rozeti
- **AuroraChat Premium** — 30 TL/ay: Tüm Basic özellikleri + animasyonlu avatar, özel banner, dosya boyutu artışı, öncelikli destek

"Satın Al" butonuna basınca toast: "Şu anda henüz üyelik sistemi gelmedi ama yakında!"

**Dosya:** `src/pages/Settings.tsx` — Yeni `premium` tab içeriği.

---

### 5. Dosya Ekleri — Discord Tarzı Embed

**Mevcut:** `MessageAttachments.tsx` sadece görselleri gösteriyor. `FileUploadPreview.tsx` sadece resim preview'ı gösteriyor.

**Yeni:**
- `ChatArea.tsx`'teki dosya seçici `accept="*"` olarak değiştirilir (sadece resim değil tüm dosyalar)
- `FileUploadPreview.tsx`: Resim olmayan dosyalar için dosya adı + boyut gösterimi
- `MessageAttachments.tsx`: URL'nin uzantısına göre resim mi dosya mı karar verilir. Dosya ise Discord tarzı embed: dosya adı, boyutu, indirme butonu.
- İndirme butonuna tıklayınca `AlertDialog` ile uyarı: "Bu dosya sakıncalı olabilir. İndirmek ister misiniz?" + "Bir daha gösterme" checkbox'ı → `localStorage`'a kaydedilir.

**Dosyalar:**
- `src/components/MessageAttachments.tsx` — Dosya embed bileşeni eklenir
- `src/components/FileUploadPreview.tsx` — Dosya desteği eklenir
- `src/components/ChatArea.tsx` — Dosya seçici `accept` güncellenir

---

### 6. v0.2.5 Sürüm Yayını

- `src/components/ReleaseNotesModal.tsx` — `CURRENT_VERSION = '0.2.5'`
- `src/data/changelogData.ts` — v0.2.5 eklenir

---

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/components/UserProfileCard.tsx` | `status` prop ekle, iç presence subscription kaldır |
| `src/components/MemberList.tsx` | UserProfileCard'a status prop'u geçir |
| `src/components/ChatArea.tsx` | UserProfileCard'a status geçir, dosya seçici accept="*" |
| `src/pages/ServerSettings.tsx` | Mobil: dikey liste + alt sayfa + geri butonu |
| `src/pages/Settings.tsx` | Mobil: dikey liste + alt sayfa + premium sekmesi |
| `src/components/MessageAttachments.tsx` | Dosya embed desteği + indirme uyarısı |
| `src/components/FileUploadPreview.tsx` | Dosya (non-image) desteği |
| `src/components/ReleaseNotesModal.tsx` | v0.2.5 |
| `src/data/changelogData.ts` | v0.2.5 sürüm notları |

