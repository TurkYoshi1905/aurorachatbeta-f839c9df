

## Plan: v0.1.3 — Discord Estetiği, Ses Kontrolleri, Hesap Silme ve UI İyileştirmeleri

Bu büyük güncelleme 5 ana başlık altında toplam ~8 dosyayı etkiler.

---

### 1. DM Sayfası & User Info Paneli

**`src/components/DMDashboard.tsx`**
- Boş durum illüstrasyonunu daha estetik hale getir (SVG illustration veya daha büyük/renkli ikon + gradient text)
- Hover efektlerini ve X butonunu daha belirgin yap

**`src/pages/Index.tsx`** (home layout kısmı, satır ~835)
- DM sayfasında (home) ChannelList'teki alt User Info panelini (avatar + durum + mic/headphones/settings) entegre et
- Yeni bir `UserInfoPanel` bileşeni oluştur ve hem ChannelList hem DM layoutunda kullan

**`src/components/UserInfoPanel.tsx`** (yeni dosya)
- ChannelList satır 83-112'deki paneli ayrı bileşen olarak çıkar
- Props: profile, currentUserStatus, onStatusChange, onNavigateSettings
- Hem ChannelList hem DM home layoutunda kullanılacak

### 2. Ses Kontrolü ve Cihaz Ayarları

**`src/components/UserInfoPanel.tsx`**
- Mic ve Headphones ikonlarına toggle state ekle (micMuted, deafened)
- Kapatıldığında `MicOff` / `HeadphonesOff` (lucide) kullan (kırmızı çizgili ikonlar)
- Her ikonun yanına küçük `ChevronDown` ekle → tıklandığında Popover açılsın
- Popover içinde `navigator.mediaDevices.enumerateDevices()` ile:
  - Giriş cihazları (audioinput) listesi
  - Çıkış cihazları (audiooutput) listesi
- Seçili cihazı state'te tut (henüz gerçek ses bağlantısı yok, sadece UI)

### 3. Mesaj Çubuğu & GIF İyileştirmeleri

**`src/components/ChatArea.tsx`** (satır 255-270)
- Mesaj çubuğundaki ikon sırasını Discord'a uygun düzenle: `[+] input [Gift] [GIF] [Emoji] [Send]`
- GIF ikonu: mevcut `GifPicker` zaten Popover ile click-to-open çalışıyor ✓
- GIF'i `Gift` ikonu yerine ayrı bir "GIF" text ikonu ile göster (Discord'daki gibi)
- Mobilde de GIF ve Gift göster (şu an `!isMobile` kontrolü var, kaldır)

**`src/components/DMChatArea.tsx`** (satır 195-210)
- Aynı ikon düzenini DM mesaj çubuğuna da uygula

### 4. Güvenli Hesap Silme (Database + Edge Function)

**Veritabanı Migrasyonu:**
- Edge function oluştur: `supabase/functions/delete-account/index.ts`
  1. Auth token'dan user_id al
  2. `profiles` tablosunda display_name → `Deleted User [kısa ID]`, avatar_url → null, username → `deleted_[uuid]`
  3. `messages` tablosunda author_name → `Deleted User` güncelle (mesajlar silinmez)
  4. `direct_messages` tablosundaki mesajlar korunsun
  5. `server_members`, `friends`, `server_member_roles` kayıtlarını sil
  6. `auth.admin.deleteUser(user_id)` ile auth kaydını sil
  7. Profile kaydını sil

**`src/pages/Settings.tsx`** (satır 215-219)
- "Hesabı Sil" butonunu aktif et (şu an disabled)
- Onay dialogu ekle (AlertDialog): "Bu işlem geri alınamaz" uyarısı
- Edge function'a istek at, başarılı olursa signOut + navigate('/login')

### 5. Ayarlar İyileştirmeleri

**`src/pages/Settings.tsx`**
- Pencil ikonlarını daha modern buton stili ile değiştir (rounded-lg bg-secondary/50 padding)
- "Görünüm ve Dil" sekmesine tema seçici ekle: Koyu / Açık / Sistem (şimdilik sadece UI, localStorage'a kaydet — gerçek tema değişimi next-themes ile)

**`src/data/changelogData.ts`**
- v0.1.3 changelog ekle: tüm yenilikleri madde madde listele

---

### Dosya Özeti

| Dosya | İşlem |
|---|---|
| `src/components/UserInfoPanel.tsx` | Yeni — ChannelList'ten çıkarılan alt panel |
| `src/components/ChannelList.tsx` | UserInfoPanel kullan, paneli kaldır |
| `src/components/DMDashboard.tsx` | Boş durum iyileştirme, hover efektleri |
| `src/pages/Index.tsx` | DM layoutuna UserInfoPanel ekle |
| `src/components/ChatArea.tsx` | Mesaj çubuğu ikon düzeni, mobilde GIF göster |
| `src/components/DMChatArea.tsx` | Mesaj çubuğu ikon düzeni |
| `supabase/functions/delete-account/index.ts` | Hesap silme edge function |
| `src/pages/Settings.tsx` | Hesap silme aktif, tema seçici, edit buton stili |
| `src/data/changelogData.ts` | v0.1.3 changelog |

