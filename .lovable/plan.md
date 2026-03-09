

## Plan: @here Etiketi + Tema İşlevselliği + v0.3.0

### 1. @here Etiketi

**`src/components/MentionPopup.tsx`**
- `@everyone` gibi, listeye `@here` seçeneği ekle (yeşil ikon ile)
- `'here'.includes(query)` koşuluyla göster

**`src/components/ChatArea.tsx` → `renderMessageContent`**
- `@here` için yeşil tonlu özel stil ekle: `bg-emerald-500/20 text-emerald-400`

**`src/pages/Index.tsx` → realtime mesaj subscription**
- `@here` algılandığında, sadece `status !== 'offline'` olan (çevrimiçi/boşta/rahatsız etmeyin) üyelere bildirim gönder
- `suppress_everyone` ayarını kontrol et (here için de geçerli)

### 2. Tema İşlevselliği

Şu an `handleThemeChange` sadece class toggle yapıyor ama `.light` CSS değişkenleri tanımlı değil. Açık tema çalışmıyor.

**`src/index.css`**
- `.light` sınıfı için tüm CSS değişkenlerini tanımla (açık renkler: beyaz arka plan, koyu metin, pastel tonlar)

**`src/App.tsx` veya `src/main.tsx`**
- Uygulama başlatılırken `localStorage.getItem('theme')` kontrol et ve doğru class'ı uygula (şu an sadece Settings'de uygulanıyor, sayfa yenilendiğinde dark'a dönüyor)

### 3. Sürüm Güncellemesi

- `ReleaseNotesModal.tsx`: `CURRENT_VERSION = '0.3.0'`
- `changelogData.ts`: v0.3.0 girişi — @here + tema desteği

| Dosya | Değişiklik |
|---|---|
| `src/components/MentionPopup.tsx` | @here seçeneği ekle |
| `src/components/ChatArea.tsx` | @here render stili |
| `src/pages/Index.tsx` | @here bildirim (sadece çevrimiçi üyeler) |
| `src/index.css` | `.light` tema CSS değişkenleri |
| `src/main.tsx` | Başlangıçta tema class uygulama |
| `src/components/ReleaseNotesModal.tsx` | v0.3.0 |
| `src/data/changelogData.ts` | v0.3.0 sürüm notu |

