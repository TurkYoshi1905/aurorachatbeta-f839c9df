

## Plan: Gizlilik, DM Mesaj Yonetimi, Sunucu Ikonu Duzeltmesi

### 1. Gizlilik Politikasi Sayfasi

Yeni dosya: `src/pages/PrivacyPolicy.tsx`
- Profesyonel gizlilik politikasi metni (toplanan veriler: e-posta, profil bilgileri, mesaj icerikleri, IP adresi, kullanim istatistikleri)
- "Geri Don" butonu ile navigasyon
- `App.tsx`'e `/privacy-policy` rotasi eklenir (public rota)

### 2. Ayarlar — Gizlilik & Guvenlik Sekmesi

`src/pages/Settings.tsx`'deki bos "Gizlilik & Guvenlik" sekmesine:
- **DM Izni Toggle:** "Direkt Mesajlara Izin Ver" (acik/kapali switch)
- **Arkadaslik Istekleri Yonetimi:** "Kimler istek atabilir?" secenekleri (Herkes / Arkadaslar / Hic kimse) — radio group
- **Iki Faktorlu Dogrulama:** UI bazli gosterim (yakin zamanda gelecek bildirimi)
- **Gizlilik Politikasi Linki:** `/privacy-policy` sayfasina yonlendirme butonu

Bu ayarlar su an sadece UI bazli olacak (localStorage ile persist edilebilir). Veritabani tablosu gerektirmez ilk asamada.

### 3. DM Mesaj Duzenleme ve Silme

**Veritabani Migrasyonu:**
- `direct_messages` tablosuna `updated_at` sutunu ekle (nullable timestamp)
- UPDATE RLS politikasi: `auth.uid() = sender_id`
- DELETE RLS politikasi: `auth.uid() = sender_id`
- `updated_at` icin trigger (mevcut `update_updated_at_column` fonksiyonu kullanilir)

**`src/components/DMChatArea.tsx` Degisiklikleri:**
- Her mesajin uzerine gelince (hover) kendi mesajlari icin "Duzenle" ve "Sil" butonlari goster
- Duzenleme: Mesaj icerigini input'a donustur, Enter ile kaydet, Escape ile iptal
- Silme: AlertDialog ile onay, onaylaninca DB'den sil ve state'ten cikar
- Realtime subscription'a UPDATE ve DELETE event'leri ekle
- Duzenlenmis mesajlara "(Duzenlendi)" etiketi ekle

### 4. Sunucu Ikonu Render Duzeltmesi

**`src/components/ServerSidebar.tsx` — Satir 53:**
Suanki kod `{server.icon}` olarak sadece text render ediyor. Sunucu fotografı yuklendikten sonra `icon` alani bir URL oluyor ama sidebar bunu kontrol etmiyor.

Duzeltme:
```
{server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/'))
  ? <img src={server.icon} alt="" className="w-full h-full object-cover rounded-[inherit]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
  : server.icon || server.name.charAt(0).toUpperCase()
}
```

Bu, `ServerSettingsDialog.tsx`'deki mevcut mantikla (satir 184) tutarli olacak.

### 5. Dosya Degisiklikleri

| Dosya | Islem |
|---|---|
| `src/pages/PrivacyPolicy.tsx` | Yeni sayfa — gizlilik politikasi metni |
| `src/App.tsx` | `/privacy-policy` rotasi ekle |
| `src/pages/Settings.tsx` | Gizlilik sekmesine toggle, radio group, 2FA UI ekle |
| `src/components/DMChatArea.tsx` | Mesaj duzenleme/silme UI + realtime UPDATE/DELETE dinleme |
| `src/components/ServerSidebar.tsx` | Icon render: URL ise img, degilse text fallback |
| DB Migrasyonu | `direct_messages` tablosuna `updated_at`, UPDATE/DELETE RLS politikalari, trigger |

### Teknik Detaylar

**DM Realtime genisletme:**
Mevcut subscription sadece INSERT dinliyor. UPDATE ve DELETE event'leri eklenir:
- UPDATE: `setMessages` ile ilgili mesajin icerigini guncelle, `edited: true` yap
- DELETE: `setMessages` ile mesaji state'ten cikar

**Sunucu ikonu — img onError fallback:**
Resim yuklenemezse (kirik URL), `onError` handler ile img gizlenip text fallback gosterilir. Bu, hem sidebar'da hem ayarlarda tutarli calısır.

