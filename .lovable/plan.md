

## Emoji Tepki Özelliği — Uygulama Planı

### Veritabanı Değişiklikleri

Yeni bir `message_reactions` tablosu oluşturulacak:

```text
message_reactions
├── id (uuid, PK)
├── message_id (uuid, NOT NULL)
├── user_id (uuid, NOT NULL)
├── emoji (text, NOT NULL)
├── created_at (timestamptz, default now())
└── UNIQUE(message_id, user_id, emoji)
```

RLS politikaları:
- **SELECT**: Mesajın bulunduğu sunucunun üyeleri görebilir (`server_members` üzerinden kontrol)
- **INSERT**: Giriş yapmış kullanıcılar tepki ekleyebilir (`auth.uid() = user_id`)
- **DELETE**: Kullanıcılar kendi tepkilerini kaldırabilir (`auth.uid() = user_id`)

Realtime için: `ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;`

### Kod Değişiklikleri

**1. `src/pages/Index.tsx`**
- Yeni bir `reactions` state'i eklenecek (Map veya obje: `messageId → [{emoji, userId, count}]`)
- Kanal değiştiğinde `message_reactions` tablosundan ilgili mesajların tepkileri çekilecek
- Realtime listener: `message_reactions` tablosu için INSERT/DELETE dinleyicisi — anlık güncelleme
- `handleAddReaction(messageId, emoji)` ve `handleRemoveReaction(messageId, emoji)` fonksiyonları
- Reactions verisi `ChatArea`'ya prop olarak geçilecek

**2. `src/components/ChatArea.tsx`**
- Her mesajın altına tepki butonları gösterilecek
- Mevcut tepkiler: emoji + sayı şeklinde küçük butonlar (tıklanınca toggle — ekle/kaldır)
- Hover'da görünen bir 😀 butonu ile emoji seçici açılacak
- Emoji seçici: Popover içinde sık kullanılan ~30 emoji grid'i (harici kütüphane gerekmez)
- Kullanıcının kendi tepkisi varsa buton vurgulanacak (farklı arka plan rengi)

**3. Yeni tip tanımları (`Index.tsx` içinde)**

```text
interface DbReaction {
  emoji: string;
  userIds: string[];
  count: number;
}
// reactions: Record<string, DbReaction[]>  (messageId → tepkiler)
```

### Kullanıcı Deneyimi

- Mesajın üzerine gelince mevcut düzenle/sil butonlarının yanında bir 😀 (SmilePlus) butonu görünür
- Tıklanınca küçük bir emoji grid popover'ı açılır
- Emoji seçildiğinde mesajın altında `😀 1` şeklinde bir buton belirir
- Aynı emojiye tekrar tıklanırsa tepki kaldırılır (toggle)
- Başka kullanıcıların tepkileri gerçek zamanlı olarak güncellenir

### Teknik Detaylar

- Emoji seçici harici kütüphane kullanmadan, sabit bir emoji listesiyle yapılacak (👍 ❤️ 😂 😮 😢 😡 🎉 🔥 👀 💯 vb.)
- Mevcut `@radix-ui/react-popover` bileşeni kullanılacak
- `message_reactions` tablosunda `UNIQUE(message_id, user_id, emoji)` constraint ile aynı kullanıcının aynı emojiye birden fazla tepki vermesi engellenecek
- Toggle mantığı: Tepki varsa DELETE, yoksa INSERT

