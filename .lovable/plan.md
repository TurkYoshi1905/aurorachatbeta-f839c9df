

## Plan: GIF Lightbox Desteği

### Sorun
GIF'lere tıklandığında yeni sekmede açılıyor. Bunun yerine mevcut `ImageLightbox` bileşeni kullanılarak büyük boyutta gösterilmeli.

### Çözüm

**`src/components/ChatArea.tsx`** — `renderMessageContent` fonksiyonunu stateless'tan stateful'a çevirmek gerekiyor çünkü lightbox state tutuyor. Ancak bu fonksiyon bileşen dışında tanımlı ve birden fazla yerde kullanılıyor.

En temiz yaklaşım: GIF görsellerini tıklandığında lightbox açacak şekilde bir wrapper bileşen oluşturmak.

**1. Yeni bileşen: `GifImage` (ChatArea.tsx içinde inline)**
- Tek bir GIF URL'si alır
- Tıklandığında `ImageLightbox`'ı tek görselle açar
- `<a>` yerine `<div onClick>` + `<img>` kullanır

**2. `renderMessageContent` güncelle**
- Giphy URL'lerdeki `<a><img></a>` yapısını `<GifImage url={...} />` ile değiştir (2 yer: satır 46-48 ve satır 62)

### Dosyalar
| Dosya | İşlem |
|---|---|
| `src/components/ChatArea.tsx` | `GifImage` inline bileşen ekle, `renderMessageContent`'te kullan |

