

## Plan: v0.2.2 — Mobil Mesaj Menüsü, Pürüzsüz Lightbox & Profil Kartı Düzeltmesi

### 1. Mobil Mesaj Uzun Basma Menüsü (Discord tarzı)

**Problem:** Mobilde mesaj aksiyon butonları (`group-hover:opacity-100`) görünmüyor çünkü hover mobilde çalışmaz.

**Çözüm:** `ChatArea.tsx`'te mobilde mesaja uzun basınca (long-press) açılan bir context menu/bottom sheet ekle:
- `longPressMessageId` state + `onTouchStart`/`onTouchEnd` ile 500ms uzun basma algılama
- Uzun basınca ekranın altından açılan menü (Dialog/Sheet): Yanıtla, Konu Başlat, Tepki Ekle, Sabitle, Düzenle, Sil
- Her menü öğesinde ikon + yazı
- Mevcut hover menüsü masaüstünde korunur, mobilde gizlenir
- Menü dışına tıklayınca kapanır

### 2. ImageLightbox İyileştirmeleri

**Pürüzsüz geçiş:** Resimler arası geçişte CSS `transition` ekle — fade-in/out animasyonu:
- Resim değiştiğinde `opacity: 0 → 1` animasyonu (300ms)
- `animating` state ile geçiş sırasında önceki resmi kısa süre göster

**Buton yazıları:** Bottom bar'daki butonlarda `hidden sm:inline` kaldır — her zaman yazı göster:
- "Orijinali Aç" → her zaman görünür
- "İndir" → her zaman görünür
- Top bar'daki zoom butonlarına da tooltip/yazı ekle

### 3. Profil Kartı Mobil Düzeltmesi

**Problem:** `PopoverContent` mobilde ekranın dışına taşıyor (2. resimde görüldüğü gibi).

**Çözüm:** Mobilde Popover yerine tam ekran Dialog/Sheet kullan:
- `useIsMobile()` hook ile cihaz tespiti
- Mobilde: `Sheet` (bottom sheet) olarak aç — `side="bottom"`, `max-h-[85vh]`, scroll destekli
- Masaüstünde: Mevcut Popover korunsun
- Aynı içerik her iki görünümde de render edilecek (ortak bileşen)

### 4. v0.2.2 Sürüm Notları

- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.2.2'`
- `changelogData.ts`: Yeni sürüm notu ekle
- i18n dosyaları: Yeni çeviri anahtarları (longPress menü etiketleri)

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/components/ChatArea.tsx` | Long-press handler, mobil context menu (Sheet), hover menüyü mobilde gizle |
| `src/components/ImageLightbox.tsx` | Fade geçiş animasyonu, buton yazılarını her zaman göster |
| `src/components/UserProfileCard.tsx` | Mobilde Sheet, masaüstünde Popover |
| `src/components/ReleaseNotesModal.tsx` | v0.2.2 |
| `src/data/changelogData.ts` | v0.2.2 sürüm notları |
| `src/i18n/*.ts` | Yeni çeviri anahtarları |

