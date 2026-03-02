

## Plan: v0.0.7 Davet/Embed Fix + Sürüm Notu

### Sorun Analizi

1. **`servers` tablosu RLS**: SELECT politikasi sadece `server_members` olan kullanicilara izin veriyor. Bu yuzden `ServerInviteEmbed` ve `InvitePage` bilesenlerinde `server_invites` join `servers(...)` sorgusu, sunucu uyesi olmayan kullanicilar icin bos donuyor.

2. **`activeServer === 'home'` hatasi**: Index.tsx'te `fetchMembers` ve mesaj fetch `'home'` stringini UUID olarak gonderiyor, 400 hatasi olusuyor.

### Degisiklikler

#### 1. Veritabani Migrasyonu — Servers icin yeni RLS politikasi

Mevcut `Servers viewable by members` politikasini degistirmeden, davet kodu uzerinden sunucu bilgilerine erisim saglayan bir **security definer fonksiyonu** olustur:

```sql
CREATE OR REPLACE FUNCTION public.get_server_by_invite_code(_code text)
RETURNS TABLE(id uuid, name text, icon text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.name, s.icon
  FROM servers s
  JOIN server_invites si ON si.server_id = s.id
  WHERE si.code = _code
    AND (si.expires_at IS NULL OR si.expires_at > now())
    AND (si.max_uses IS NULL OR si.uses < si.max_uses);
$$;
```

Bu fonksiyon RLS'i bypass eder ve sadece gecerli invite kodu ile sunucu ad/ikon bilgisini dondurur.

#### 2. `ServerInviteEmbed.tsx` — RPC kullan

Mevcut `server_invites` + `servers(...)` join sorgusunu `supabase.rpc('get_server_by_invite_code', { _code: code })` ile degistir. Boylece kullanici sunucu uyesi olmasa bile embed karti gorunur.

#### 3. `InvitePage.tsx` — RPC kullan

Ayni sekilde `server_invites` join sorgusunu RPC'ye cevir. Gecersiz/suresi dolmus davetler icin uyari goster, gecerli olanlar icin sunucu onizlemesi goster.

#### 4. Index.tsx — `fetchMembers` guard

`fetchMembers` fonksiyonuna `if (activeServer === 'home') return;` guard'i ekle. Ayni sekilde mesaj fetch useEffect'ine de `activeServer === 'home'` kontrolu ekle (zaten `activeServer && activeChannel` var ama `'home'` truthy).

#### 5. Settings.tsx — v0.0.7 surumu

Changelog'a v0.0.7 entry ekle: "Gelismis Davet Sistemi ve Embed Onizleme Iyilestirmeleri"

### Dosya Degisiklikleri

| Dosya | Islem |
|---|---|
| Migration SQL | `get_server_by_invite_code` fonksiyonu |
| `src/components/ServerInviteEmbed.tsx` | RPC ile sunucu bilgisi cek |
| `src/pages/InvitePage.tsx` | RPC ile sunucu bilgisi cek |
| `src/pages/Index.tsx` | `fetchMembers` ve mesaj fetch'te `'home'` guard |
| `src/pages/Settings.tsx` | v0.0.7 changelog entry |

