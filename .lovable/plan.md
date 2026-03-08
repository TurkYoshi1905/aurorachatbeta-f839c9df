

## Plan: GIF İkonunu Özel Görsel ile Değiştir

Kullanıcı, yüklediği `gif_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png` dosyasını GIF butonu ikonu olarak kullanmak istiyor. Şu an `Gift` (lucide) ikonu kullanılıyor.

### Değişiklikler

**1. Görseli projeye kopyala**
- `user-uploads://gif_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png` → `src/assets/gif-icon.png`

**2. `src/components/GifPicker.tsx`**
- `Gift` lucide ikonunu kaldır, yerine `<img src={gifIcon} />` kullan
- Import: `import gifIcon from '@/assets/gif-icon.png'`
- Boyut: `w-5 h-5` class ile (mevcut ikonlarla tutarlı)
- `brightness` filter ile tema uyumu sağla (dark modda beyaz görünsün)

### Etkilenen Alanlar
- Sunucu sohbet mesaj çubuğu (ChatArea.tsx) — GifPicker zaten kullanılıyor ✓
- DM sohbet mesaj çubuğu (DMChatArea.tsx) — GifPicker zaten kullanılıyor ✓
- Tek dosya değişikliği yeterli, her iki yere de otomatik yansır.

