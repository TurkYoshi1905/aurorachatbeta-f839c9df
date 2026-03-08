

## Plan: Lightbox Resim Geçiş Animasyonu Düzeltmesi

**Problem:** Mevcut kod `fadeIn` state'ini `false` yapıp 20ms sonra `true` yapıyor — bu süre çok kısa, tarayıcı opacity geçişini algılayamıyor. Sonuç: animasyon görünmüyor.

**Çözüm:** İki aşamalı fade-out/fade-in yaklaşımı:

1. Resim değiştiğinde önce `opacity: 0` yap (fade-out, 150ms bekle)
2. Sonra yeni resmi yükle ve `opacity: 1` yap (fade-in, 300ms CSS transition)
3. `requestAnimationFrame` kullanarak tarayıcının repaint yapmasını garanti et

**Değişiklik — `src/components/ImageLightbox.tsx`:**
- `fadeIn` state yerine `animatingOut` + `displayIndex` pattern'i kullan
- Index değiştiğinde: `animatingOut = true` → 150ms bekle → `displayIndex` güncelle → `animatingOut = false`
- CSS transition zaten mevcut (`opacity 0.3s ease-in-out`), sadece timing düzeltilecek

Tek dosya değişikliği, küçük ama etkili bir düzeltme.

