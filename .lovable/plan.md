

## Plan: Kritik İletişim ve Görselleştirme Hatalarını Onar

### Kök Neden Analizi

**1. Link/Embed tamamen çalışmıyor** — `ChatArea.tsx` satır 31'deki URL regex `[\s]` (boşluk) kullanıyor, doğrusu `[^\s]` (boşluk olmayan). Bu yüzden hiçbir link algılanmıyor, hiçbir embed gösterilmiyor.

**2. DM'de link/embed desteği yok** — `DMChatArea.tsx` satır 187'de `msg.content` düz metin olarak render ediliyor. `ChatArea`'daki `renderMessageContent` fonksiyonu DM tarafında hiç kullanılmıyor.

**3. ServerInviteEmbed ikon hatası** — `onError` handler resmi gizliyor ama fallback harfi göstermiyor çünkü if/else dalında kalıyor.

**4. DM Realtime** — Yapı doğru görünüyor, ama kontrol edilecek.

---

### Değişiklikler

#### 1. `src/components/ChatArea.tsx` — URL Regex Düzeltmesi

3 yerde `[\s]` → `[^\s]` olarak düzelt (satır 31, 36, 44):
```
ÖNCE:  /(https?:\/\/[\s]+)/g
SONRA: /(https?:\/\/[^\s]+)/g
```

Bu düzeltmeyle tüm linkler algılanacak, mavi renkte tıklanabilir olacak, invite embed'leri ve link preview'ları çalışacak.

#### 2. `src/components/DMChatArea.tsx` — Link/Embed Desteği Ekle

- `ChatArea.tsx`'teki `renderMessageContent` fonksiyonunu import et veya ortak bir util'e taşı
- DM mesajlarında düz `<p>` yerine `renderMessageContent(msg.content)` kullan
- `ServerInviteEmbed` ve `LinkEmbed` import'larını ekle

#### 3. `src/components/ServerInviteEmbed.tsx` — İkon Fallback Düzeltmesi

- `onError` handler'da resmi gizlemek yerine, state ile kontrol et ve fallback harfini göster
- `useState` ile `imgError` flag'i ekle
- i18n desteği ekle (hardcoded Türkçe metinler)

#### 4. `src/components/ChatArea.tsx` — `renderMessageContent` Dışa Aktarma

`renderMessageContent` fonksiyonunu `export` yap, böylece DMChatArea da kullanabilsin. Veya ortak bir dosyaya taşı.

---

### Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| `src/components/ChatArea.tsx` | URL regex `[^\s]` düzeltmesi (3 yer), `renderMessageContent` export |
| `src/components/DMChatArea.tsx` | `renderMessageContent` kullanarak link/embed desteği ekle |
| `src/components/ServerInviteEmbed.tsx` | İkon fallback state ile düzelt, i18n ekle |

