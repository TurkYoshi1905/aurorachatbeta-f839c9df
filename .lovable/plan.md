

## Plan: Tenor → Giphy Geçişi

Giphy API key public/publishable olduğu için doğrudan frontend'de kullanılabilir. Edge function'a gerek kalmaz.

### Değişiklikler

**1. Edge Function kaldır** — `supabase/functions/tenor-search/index.ts` silinecek.

**2. `src/components/GifPicker.tsx` yeniden yaz:**
- Giphy API'yi doğrudan frontend'den çağır (public API key)
- URL: `https://api.giphy.com/v1/gifs/search?api_key=yYrhkp1WvT2DmLzN0oH3htGlGCAHACoy&q=...&limit=20&rating=g`
- Trending GIF'leri açılışta göster: `https://api.giphy.com/v1/gifs/trending?api_key=...&limit=20&rating=g`
- Response mapping: `data[].images.fixed_height_small.url` (preview), `data[].images.original.url` (full)
- "Powered by Tenor" → "Powered by GIPHY" (Giphy attribution gereksinimi)

### Dosyalar

| Dosya | İşlem |
|---|---|
| `src/components/GifPicker.tsx` | Giphy API'ye geçir, trending ekle |
| `supabase/functions/tenor-search/index.ts` | Sil |

