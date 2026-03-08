

## Plan: GIF Görüntüleme Düzeltmesi + Chat Input GIF İkonu

### Sorun 1: GIF link olarak görünüyor
`renderMessageContent` fonksiyonu Giphy URL'lerini normal link olarak işliyor. Giphy URL'leri tespit edilip `<img>` olarak render edilmeli.

### Çözüm
**`src/components/ChatArea.tsx` → `renderMessageContent` fonksiyonu:**
- Giphy URL pattern'i ekle: `giphy.com/media/` veya `.giphy.com/` içeren URL'ler
- Bu URL'ler için link text yerine `<img>` render et (tıklanabilir, rounded, max boyut sınırlı)
- `LinkEmbed` listesinden de Giphy URL'lerini çıkar (çift embed olmasın)

### Sorun 2: GIF ikonu chat input'ta yok
`GifPicker` bileşeni zaten `ChatArea.tsx`'te import edilmiş ve input alanında kullanılıyor (satır ~240 civarı). Mevcut durumu kontrol edip görünür olduğundan emin olacağım.

### Dosyalar
| Dosya | İşlem |
|---|---|
| `src/components/ChatArea.tsx` | renderMessageContent'e Giphy img desteği ekle, GIF ikonunun input'ta göründüğünü doğrula |

