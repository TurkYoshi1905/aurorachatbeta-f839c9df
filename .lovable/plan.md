

## Plan: Mobil Arayuz Duzeltmeleri ve UI Polish

Ekran goruntuleri sorunlari net gosteriyor: kanal listesi ve profil bari mobilde icerik alanini kapliyor, uyeler sayfasi ust kismda kalip alta yayilmiyor, bottom nav ile icerik arasinda bosluk/z-index sorunlari var.

---

### 1. MobileBottomNav Duzeltmeleri (`src/pages/Index.tsx`)

- Bottom nav'a `fixed bottom-0 left-0 right-0 z-50` ekle, boylece her zaman ekranin altinda sabit kalsin
- Icerik alanina `pb-14` (bottom nav yuksekligi kadar padding) ekle, icerik nav'in altina girmesin
- `100dvh` kullanimi zaten var, bunu koruyoruz
- Bottom nav'da `flex-1` ile ikonlarin esit dagilmasini sagla, `text-xs` ile yazilari kucult

### 2. Kanal Listesi Mobil Duzeltmesi (`src/components/ChannelList.tsx`)

- Mobilde `isMobile` prop'u zaten mevcut ve `flex-1` kullaniyor — dogru
- Profil barini (`h-[52px]` alt kisim) `sticky bottom-0` yap, kaydirma alaninin altinda sabit kalsin (su an zaten altta ama flex yapisinda sorun olabilir)
- Mobilde kanal listesi tam ekran kaplayacak sekilde `h-full` ekle

### 3. Uyeler Listesi Duzeltmesi (`src/components/MemberList.tsx`)

- Mobilde `flex-1` yerine `h-full` kullan, boylece tam icerik alanini kaplasin
- Ust kisimdaki "Geri" butonu ve icerik arasindaki boslugu optimize et

### 4. Gorsel Iyilestirmeler

**`src/index.css`:**
- Kanal arka plani ve sidebar arka plani arasindaki kontrasti artir: sidebar `hsl(228, 14%, 11%)`, kanal listesi `hsl(228, 12%, 14%)`, chat alani `hsl(228, 12%, 17%)` — Discord'un karartma hiyerarsisine benzer sekilde
- Aktif bottom nav item'a `border-top` veya `bg-primary/10` ile belirgin active state ekle

**`src/pages/Index.tsx` - MobileBottomNav:**
- Aktif sekmeye `bg-primary/10 rounded-lg` ve `font-medium` ekle
- Border-top rengini daha belirgin yap

**`src/components/ChannelList.tsx`:**
- "METIN KANALLARI" basligiyla kanallar arasi bosluklari optimize et (`mb-1` yerine `mb-0.5`)
- Kanal arka plan rengini sidebar'dan farkli tut

### 5. Dosya Degisiklikleri

| Dosya | Islem |
|---|---|
| `src/pages/Index.tsx` | Bottom nav'i fixed yap, icerik padding ekle, aktif state guclendir |
| `src/components/ChannelList.tsx` | Profil bar pozisyonu, mobil yukseklik, spacing |
| `src/components/MemberList.tsx` | Mobil tam ekran, spacing |
| `src/index.css` | Renk kontrast hiyerarsisi, aktif state stilleri |

