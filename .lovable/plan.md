

## Plan: Özel Emoji Render + DM Arayüz İyileştirme + v0.3.1

Seçtiğiniz özellikler çok kapsamlı — hepsini tek sürümde yapmak yerine, v0.3.1'de **emoji render düzeltmesi + DM arayüz iyileştirmesi** yapacağım. Diğer özellikler (hoş geldin mesajı, slow mode, oto-mod, özel durum mesajı, ses ayarları, bildirim sesleri, DM arama/tepki/sabitleme/profil paneli) sonraki sürümlerde sırasıyla eklenecek.

---

### 1. Sunucu Emoji Render Düzeltmesi

**Sorun:** `renderMessageContent` içindeki `processCustomEmojis` fonksiyonu sadece doğrudan string olan elementlere uygulanıyor. Mention span'ları (`@user`, `@everyone`) içindeki `:emoji:` metinleri dönüştürülmüyor.

**Çözüm** (`src/components/ChatArea.tsx`):
- `processCustomEmojis`'i recursive hale getir — React element children'larını da dolaşsın
- `elements.map` içindeki render'da tüm elementleri `processCustomEmojis`'ten geçir
- Mention span'ları içindeki text node'larına da emoji dönüşümü uygula

### 2. DM Arayüz İyileştirmesi

**`src/components/DMChatArea.tsx`** — Masaüstü + Mobil:

- **Header**: Kullanıcı durumu (online/offline) göstergesi, kullanıcı adı altına username ekleme
- **Mesaj baloncukları**: Kendi mesajların sağa hizalı, farklı renk (Discord DM stili)
- **Input alanı**: Daha fazla boşluk, butonlar arası düzgün hizalama
- **Mobil**: Header'da safe-area padding, input alanında mobil-optimize boyutlar
- **Başlangıç alanı**: Daha kompakt avatar + açıklama, görsel iyileştirme
- **Mesaj aksiyonları (düzenle/sil)**: Mobilde long-press veya her zaman görünür ikonlar

### 3. Sürüm Güncellemesi

- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.3.1'`
- `changelogData.ts`: v0.3.1 girişi

| Dosya | Değişiklik |
|---|---|
| `src/components/ChatArea.tsx` | `processCustomEmojis` recursive + tüm text node'lara uygula |
| `src/components/DMChatArea.tsx` | DM arayüzü iyileştirme (header, mesaj stili, mobil uyum) |
| `src/components/ReleaseNotesModal.tsx` | v0.3.1 |
| `src/data/changelogData.ts` | v0.3.1 sürüm notu |

