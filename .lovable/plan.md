

## Plan: @everyone Etiket İşlevselliği + v0.2.9

### Yapılacaklar

**1. MentionPopup'a @everyone seçeneği ekle** (`src/components/MentionPopup.tsx`)
- Filtrelenmiş üye listesinin başına sabit bir "everyone" seçeneği ekle (🔔 ikonu ile)
- `query` boş veya "everyone" ile eşleşiyorsa göster
- Seçildiğinde `onSelect("everyone")` çağır

**2. @everyone mesaj render'ını özel stil ile göster** (`src/components/ChatArea.tsx` → `renderMessageContent`)
- `@everyone` metnini özel stil ile render et: Discord gibi sarı/turuncu tonlu arka plan, bold
- Mevcut `mentionRegex` zaten `@everyone`'ı yakalıyor, sadece "everyone" eşleşmesinde farklı stil uygula

**3. @everyone bildirim gönderimi** (`src/pages/Index.tsx` → realtime subscription)
- Gelen mesajda `@everyone` varsa, mesajı gönderen kişi hariç tüm sunucu üyelerine bildirim oluştur
- `notification_settings` tablosundaki `suppress_everyone` ayarını kontrol et — true ise o kullanıcıya bildirim gönderme
- Bildirim tipi: `mention`, başlık: `{author} herkesi etiketledi`
- Tarayıcı bildirimi de göster (sayfa gizliyse)

**4. Sürüm güncellemesi**
- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.2.9'`
- `changelogData.ts`: v0.2.9 girişi — @everyone işlevselliği

### Dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/components/MentionPopup.tsx` | "everyone" seçeneğini listeye ekle |
| `src/components/ChatArea.tsx` | `@everyone` için özel render stili |
| `src/pages/Index.tsx` | `@everyone` bildirim mantığı (suppress_everyone kontrolü dahil) |
| `src/components/ReleaseNotesModal.tsx` | v0.2.9 |
| `src/data/changelogData.ts` | v0.2.9 sürüm notu |

