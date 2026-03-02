

## Plan: Sidebar Modernizasyonu + DM Realtime Fix

### 1. ServerSidebar Modernizasyonu

**Mevcut sorun:** Tüm öğeler tek bir `overflow-y-auto` div içinde, butonlar kaydırma alanıyla birlikte kayıyor.

**Çözüm:** Sidebar'ı 3 bölüme ayır:
- **Üst (sabit):** Home/DM butonu + ayırıcı
- **Orta (kaydırılabilir, flex-1):** Sunucu listesi — `overflow-y-auto scrollbar-thin`
- **Alt (sabit):** "Sunucu Oluştur" ve "Sunucuya Katıl" butonları

100 sunucu limiti: `servers.length >= 100` kontrolü ile butonları deaktif et ve tooltip ile uyarı göster.

Layout sabitleme: `min-w-[72px] max-w-[72px] h-screen` ile taşma engellenir.

```text
┌──────────┐
│  Home 🏠  │  ← sabit üst
│ ──────── │
│  srv1    │
│  srv2    │  ← kaydırılabilir orta (flex-1)
│  srv3    │
│  ...     │
│ ──────── │
│   +      │  ← sabit alt
│   →      │
└──────────┘
```

### 2. DM Realtime Fix

**Mevcut sorun:** `DMChatArea.tsx` realtime subscription'ı doğru görünüyor ama filtreleme eksik olabilir. Realtime subscription filter ekleyerek sadece ilgili mesajları dinleyelim ve channel adını unique yapalım.

**Değişiklik:** `DMChatArea.tsx`'te realtime subscription'a `filter` parametresi eklenmeli. Şu an tüm `direct_messages` INSERT'leri dinleniyor ve sonra client-side filtreleme yapılıyor. Bu doğru bir yaklaşım ama kanalın doğru subscribe olup olmadığından emin olmak için:
- Channel adını daha belirgin yap
- Subscribe callback'te status kontrolü ekle
- `dmUser` dependency'sini `dmUser.userId` olarak daralt (referans değişikliği sorununu önle)

### Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| `src/components/ServerSidebar.tsx` | 3 bölümlü layout, sabit butonlar, 100 limit |
| `src/components/DMChatArea.tsx` | Realtime subscription fix — dependency daraltma, status kontrolü |

