

## Plan: Dosya Adı & Boyut Düzeltmesi + v0.2.7

### Problem
1. `uploadFiles()` dosyayı `crypto.randomUUID().ext` olarak yüklüyor → orijinal dosya adı kayboluyor
2. `MessageAttachments.tsx` → `getFileName()` URL'den UUID'yi çıkarıyor, orijinal adı gösteremiyor
3. `formatFileSize()` boş string döndürüyor — dosya boyutu hiç gösterilmiyor

### Çözüm

**1. `src/components/DMChatArea.tsx` — `uploadFiles` fonksiyonu**
- Upload path'i: `{userId}/{context}/{messageId}/{uuid}_{originalFileName}` (orijinal dosya adı korunsun, UUID çakışmayı önlesin)
- Public URL'e query param ekle: `?originalName=encodeURIComponent(file.name)&size=file.size`

**2. `src/components/MessageAttachments.tsx`**
- `getFileName()`: Önce URL'deki `originalName` query param'ını kontrol et, varsa onu döndür. Yoksa path'ten son segmenti al (fallback).
- `formatFileSize()`: URL'deki `size` query param'ını oku, varsa formatla (KB/MB). Yoksa boş döndür.
- Dosya kartında boyut bilgisini göster.

**3. Sürüm Güncellemesi**
- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.2.7'`, notlar güncelle
- `changelogData.ts`: v0.2.7 girişi ekle (dosya adı/boyut düzeltmesi)

| Dosya | Değişiklik |
|---|---|
| `src/components/DMChatArea.tsx` | Upload path'e orijinal dosya adı + URL'e query params ekle |
| `src/components/MessageAttachments.tsx` | `getFileName` ve `formatFileSize` query param'dan oku |
| `src/components/ReleaseNotesModal.tsx` | v0.2.7 |
| `src/data/changelogData.ts` | v0.2.7 sürüm notu |

