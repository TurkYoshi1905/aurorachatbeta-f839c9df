

## Plan: UI/UX Modernizasyonu + Dinamik Changelog Sistemi + v0.0.8

Bu plan 4 ana bölümden oluşuyor: global UI iyileştirmeleri, mobil bottom navigation bar, dinamik changelog sayfaları ve v0.0.8 sürüm notu.

---

### 1. Dinamik Changelog Sistemi

**Yeni dosyalar:**
- `src/data/changelogData.ts` — Tüm sürüm notlarını içeren dizi (Settings.tsx'ten taşınacak). v0.0.8 eklenecek.
- `src/pages/Changelog.tsx` — `/changelog` ana sayfası: sürümleri kartlar halinde listeler (sürüm no, tarih, kısa özet). Her karta tıklayınca detay sayfasına gider.
- `src/pages/ChangelogDetail.tsx` — `/changelog/:version` dinamik sayfası: "Yenilikler", "Düzeltmeler", "Geliştirmeler" başlıklarıyla detaylı görünüm.

**Değişiklikler:**
- `src/App.tsx` — `/changelog` ve `/changelog/:version` rotaları eklenir (public, auth gerekmez).
- `src/pages/Settings.tsx` — Changelog verisini `changelogData.ts`'den import eder, kendi içindeki hardcoded diziyi kaldırır. Changelog sekmesine "/changelog sayfasına git" linki eklenir.

### 2. v0.0.8 Sürüm Notu İçeriği

```
v0.0.8 — 2 Mart 2026
Yenilikler:
- Dinamik sürüm notları sistemi (/changelog sayfası)
- Mobil bottom navigation bar eklendi
- 100 sunucu limiti ve sabit alt butonlar

Düzeltmeler:
- DM ve kanal mesajlarında realtime sorunları giderildi

Geliştirmeler:
- Tüm sayfalar mobil cihazlar için optimize edildi
- UI modernizasyonu: rounded-xl, tutarlı spacing
```

### 3. Global UI Modernizasyonu

**`src/index.css`:**
- `--radius` değerini `0.75rem` yap (rounded-xl efekti).
- `.server-icon` border-radius'u `rounded-2xl` yap.

**Bileşen bazlı iyileştirmeler:**
- `ChatArea.tsx` — Mesaj input alanına `rounded-xl` ve hafif glow border ekle.
- `ChannelList.tsx` — Kanal butonlarına `rounded-lg` ve daha fazla padding.
- `DMDashboard.tsx` — Tab list ve kart alanlarına `rounded-xl`.
- `MemberList.tsx` — Üye satırlarına `rounded-lg`.
- `ServerSidebar.tsx` — Tooltip ve buton stillerinde tutarlılık.

### 4. Mobil Bottom Navigation Bar + Hamburger

**`src/pages/Index.tsx` mobil görünüm değişiklikleri:**

Mevcut mobil yapı `mobileView` state'i ile çalışıyor. Bunu geliştiriyoruz:

- Mobil layouta sabit bir bottom navigation bar eklenir (Home, Kanallar, Sohbet, Üyeler, Ayarlar ikonları).
- `ServerSidebar` mobilde hamburger menu ile açılır/kapanır (Sheet bileşeni kullanılarak).
- Bottom bar her zaman görünür, aktif sekme vurgulanır.

**Yapı:**
```text
┌─────────────────────┐
│    Header           │
├─────────────────────┤
│                     │
│    Content Area     │
│    (dynamic)        │
│                     │
├─────────────────────┤
│ 🏠  📋  💬  👥  ⚙️  │  ← Bottom Nav (mobil)
└─────────────────────┘
```

**Masaüstü:** Sidebar zaten sabit ve `min-w-[72px]`. Değişiklik yok, sadece stil iyileştirmeleri.

### 5. Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|---|---|
| `src/data/changelogData.ts` | **Yeni** — changelog verisi |
| `src/pages/Changelog.tsx` | **Yeni** — changelog listesi |
| `src/pages/ChangelogDetail.tsx` | **Yeni** — sürüm detayı |
| `src/App.tsx` | Yeni rotalar ekle |
| `src/pages/Settings.tsx` | Changelog verisini import et, v0.0.8 ekle |
| `src/pages/Index.tsx` | Mobil bottom nav bar ekle, hamburger menu |
| `src/index.css` | radius ve stil güncellemeleri |
| `src/components/ChatArea.tsx` | Input ve mesaj stili modernizasyonu |
| `src/components/ChannelList.tsx` | Buton ve spacing iyileştirmeleri |
| `src/components/DMDashboard.tsx` | Kart ve tab stili |
| `src/components/MemberList.tsx` | Rounded ve spacing |
| `src/components/ServerSidebar.tsx` | Mobilde Sheet içinde açılma |

