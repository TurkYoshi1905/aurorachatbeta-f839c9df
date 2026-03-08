

## Plan: Discord Tarzı Gelişmiş Lightbox + v0.1.2 Changelog

### 1. `src/components/ImageLightbox.tsx` — Tamamen yeniden yaz

**Zoom & Pan desteği:**
- `useState` ile `scale` ve `position` (x, y) state'leri
- Mouse wheel → `scale` değiştir (1x–5x arası, step 0.25)
- Mouse drag (mousedown/mousemove/mouseup) → pan (sadece scale > 1 iken)
- Mobilde: `onTouchStart/onTouchMove/onTouchEnd` ile pinch-to-zoom ve tek parmak sürükleme
- Çift tıklama ile zoom reset

**Mobil swipe ile galeri geçişi:**
- Touch start/end X koordinat farkı > 50px ise önceki/sonraki resme geç (sadece scale === 1 iken)

**Alt bar (Discord tarzı):**
- Resmin altında yarı saydam bar: "Orijinali Aç" (yeni sekmede açar) + "İndir" butonları
- Sayfa numarası göstergesi: `2 / 5`

**Arka plan:**
- `bg-black/90 backdrop-blur-xl` (derin bulanıklık)
- ESC tuşu zaten mevcut, korunacak

**Ok tuşları ve galeri:**
- Mevcut sol/sağ ok tuşları ve dot göstergeleri korunacak
- Zoom aktifken ok tuşları devre dışı

### 2. `src/data/changelogData.ts` — v0.1.2 ekle

Array'in başına yeni sürüm:
- Version: `0.1.2`, Date: `8 Mart 2026`
- Yeni Özellikler: Discord tarzı lightbox (zoom, pan, swipe, galeri modu), Giphy entegrasyonu
- Geliştirmeler: Lightbox backdrop-blur, mobil touch desteği

### Dosyalar

| Dosya | İşlem |
|---|---|
| `src/components/ImageLightbox.tsx` | Zoom/pan/swipe/alt bar ekle, tamamen yeniden yaz |
| `src/data/changelogData.ts` | v0.1.2 changelog ekle |

