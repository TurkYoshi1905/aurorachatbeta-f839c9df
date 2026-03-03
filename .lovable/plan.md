

## Plan: DM Realtime, Yazıyor Göstergesi, Invite Embed, Changelog Navigasyon Düzeltmeleri

### 1. DM Realtime Sorunun Kök Nedeni ve Düzeltme

Mevcut kod zaten INSERT/UPDATE/DELETE dinliyor ve `filter: receiver_id=eq.${user.id}` kullanıyor. Sorun: UPDATE ve DELETE event'leri icin filter yok — Supabase Realtime filtre olmadan RLS kontrolunu her satir icin yapmak zorunda kaliyor ve event'ler dusebiliyor.

**Duzeltme (`src/components/DMChatArea.tsx`):**
- UPDATE event'ine `filter: receiver_id=eq.${user.id}` ekle (karsidaki kisinin duzenlemelerini almak icin)
- Ayrica kendi gonderdigimiz mesajlarin UPDATE'lerini de almak icin ikinci bir UPDATE listener ekle: `filter: sender_id=eq.${user.id}`
- DELETE icin de benzer iki filter ekle
- Alternatif: Tek bir kanal yerine, iki ayri listener kullan (biri receiver, biri sender olarak)

Aslinda daha basit yaklasim: Realtime subscription'da filter kullanmak yerine, filtresiz dinleyip client-side filtre yapmak daha guvenilir olabilir — ama bu RLS yukunu arttirir. En iyi cozum: `sender_id` ve `receiver_id` icin iki ayri listener eklemek.

### 2. DM "Yaziyor..." Gostergesi

Sunucu kanallarindaki `TypingIndicator` mantigi (`ChatArea.tsx` satir 78-102) ve Broadcast kanal kullanimi DM'e uyarlanacak.

**Degisiklikler (`src/components/DMChatArea.tsx`):**
- Supabase Broadcast kanali olustur: `dm-typing-${[user.id, dmUserId].sort().join('-')}`
- Input `onChange`'de 2 saniyelik throttle ile typing event gonder
- Input bos olunca veya mesaj gonderince stop event gonder
- Karsidaki kisinin typing event'lerini dinle ve UI'da goster
- `TypingIndicator` bilesenini ChatArea'dan import et veya ayni mantigi DM'e ekle

### 3. Invite Embed Gorsel Duzeltmesi

**Sorun (`src/components/ServerInviteEmbed.tsx` satir 61-63):** Sunucu ikonu her zaman `{server.icon}` olarak text render ediliyor, URL kontrolu yok.

**Duzeltme:**
```
{server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/'))
  ? <img src={server.icon} alt="" className="w-full h-full object-cover rounded-xl"
         onError={(e) => { e.currentTarget.style.display = 'none'; }} />
  : (server.icon || server.name.charAt(0).toUpperCase())
}
```
Ayrica ikon container boyutunu `w-12 h-12` (48x48) olarak sabitle.

### 4. Changelog Navigasyon Duzeltmesi

**Sorun:** `/changelog` sayfasindaki geri butonu `navigate(-1)` kullaniyor. Kullanici ChangelogDetail'den `/changelog`'a donup tekrar geri basinca ChangelogDetail'e geri gidiyor (browser history yuzunden).

**Duzeltme (`src/pages/Changelog.tsx`):** Geri butonunu `navigate(-1)` yerine `navigate('/settings')` yap — cunku changelog'a ayarlar sayfasindan erisiiliyor.

**Duzeltme (`src/pages/ChangelogDetail.tsx`):** Zaten `navigate('/changelog')` kullaniyor, dogru.

### 5. Dosya Degisiklikleri

| Dosya | Islem |
|---|---|
| `src/components/DMChatArea.tsx` | Realtime UPDATE/DELETE filter duzeltme + Typing indicator ekleme |
| `src/components/ServerInviteEmbed.tsx` | Icon URL kontrolu ve img render |
| `src/pages/Changelog.tsx` | Geri butonu `navigate('/settings')` |

