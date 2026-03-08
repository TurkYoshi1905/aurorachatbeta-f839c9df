

## Plan: GIF İkonunu Material Symbols Font İkonu ile Değiştir

PNG dosyası yerine Google Material Symbols font ikonunu kullanacağız.

### Değişiklikler

**1. `index.html`** — Material Symbols font linkini `<head>`'e ekle:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=gif" />
```

**2. `src/components/GifPicker.tsx`** — PNG import'u kaldır, `<img>` yerine Material Symbol `<span>` kullan:
```tsx
<span className="material-symbols-outlined text-xl opacity-70 hover:opacity-100 transition-opacity">gif</span>
```

| Dosya | İşlem |
|---|---|
| `index.html` | Font link ekle |
| `src/components/GifPicker.tsx` | PNG → Material Symbol font ikonu |

