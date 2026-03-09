

## Plan: Profil Kartı Durum Düzeltmesi, Denetim Kaydı İyileştirmesi, Renk Seçici, Yeni Sunucu Özellikleri & Şifre Değiştirme

### 1. Profil Kartı Gerçek Zamanlı Durum Düzeltmesi

**Problem:** `UserProfileCard.tsx` kendi ayrı bir presence kanalına (`profile-presence-${userId}`) abone oluyor ama kimse bu kanala track yapmıyor. Asıl presence verisi `presence-room` kanalında (Index.tsx'te).

**Çözüm:** `UserProfileCard.tsx`'teki presence effect'ini `presence-room` kanalına abone olacak şekilde değiştir:
```typescript
const channel = supabase.channel('presence-room');
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  for (const [uid, presences] of Object.entries(state)) {
    if (uid === userId) {
      const latest = (presences as any[])[presences.length - 1];
      setUserStatus(latest?.status || 'online');
      return;
    }
  }
  setUserStatus('offline');
});
```
Kanal zaten `presence-room` olarak mevcut olduğundan, Supabase SDK bunu mevcut abonelikle birleştirecek.

**Dosya:** `src/components/UserProfileCard.tsx`

---

### 2. Denetim Kaydı İyileştirmesi

**Mevcut:** Sadece basit bir liste, sınırlı aksiyon türleri.

**İyileştirmeler:**
- Aksiyon türlerine göre filtreleme dropdown'u ekle
- Daha fazla aksiyon türü etiketi ekle: `server_updated`, `channel_created`, `channel_deleted`, `emoji_added`, `emoji_deleted`, `member_banned`, `member_unbanned`
- Her log için avatar göster (profil'den)
- Tarih gruplaması (Bugün, Dün, Daha Eski)
- Toplam log sayısı göstergesi

**Dosya:** `src/pages/ServerSettings.tsx` (audit tab bölümü)

---

### 3. Roller — Renk Seçici (Color Picker)

**Mevcut:** Sadece preset renkler + hex input. Gerçek bir renk seçici yok.

**Çözüm:** Native HTML `<input type="color">` kullanarak tam renk seçici ekle. Preset renklerin yanına bir renk seçici butonu ekle:
```html
<input type="color" value={newRoleColor} onChange={...} />
```
- Mevcut rollerin rengini de düzenlenebilir yap (editingRole modunda)
- Rol oluştururken ve düzenlerken native color picker kullanılabilir olsun

**Dosya:** `src/pages/ServerSettings.tsx`

---

### 4. Sunucu Ayarlarına Yeni Discord Benzeri Özellikler

**2-3 yeni özellik:**

1. **Sunucu Yasakları (Bans) Sekmesi** — `server_bans` tablosu zaten mevcut. Yasaklı kullanıcıları listele, yasak kaldırma butonu ekle.
2. **Sunucu Genel Bakış** — Sunucu istatistikleri: toplam üye sayısı, kanal sayısı, rol sayısı, oluşturulma tarihi. Genel sekmesine ek bilgi olarak ekle.

**Dosya:** `src/pages/ServerSettings.tsx` (yeni `bans` sekmesi + genel sekmesine istatistik)

---

### 5. Kullanıcı Ayarları — Şifre Değiştirme

**Çözüm:** Ayarlar sayfasının "Hesap" sekmesine şifre değiştirme bölümü ekle:
- Yeni şifre + tekrar girişi
- `supabase.auth.updateUser({ password: newPassword })` kullanarak şifre güncelle
- Minimum 6 karakter doğrulama
- Başarılı olunca toast göster

**Dosya:** `src/pages/Settings.tsx`

---

### Dosya Değişiklikleri Özeti

| Dosya | Değişiklik |
|---|---|
| `src/components/UserProfileCard.tsx` | Presence kanalını `presence-room`'a bağla |
| `src/pages/ServerSettings.tsx` | Denetim kaydı iyileştirmesi, renk seçici, yasaklar sekmesi, sunucu istatistikleri |
| `src/pages/Settings.tsx` | Şifre değiştirme bölümü ekle |

