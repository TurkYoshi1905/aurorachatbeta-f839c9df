
Amaç: Uygulama açıldığında kullanıcılar aktif olmasına rağmen üye listesinde “çevrimdışı” görünme sorununu kalıcı olarak gidermek.

Sorunun kök nedeni:
- `src/pages/Index.tsx` içinde presence `sync` olayı ile statüler doğru set ediliyor.
- Ancak ilk yüklemede yarış durumu oluşuyor:
  1) Presence `sync` çok erken tetiklenebiliyor (members henüz boşken),
  2) Sonra `fetchMembers` çalışıp üyeleri ekliyor ve statüyü `offline` fallback’iyle yazıyor,
  3) Yeni bir `sync` gelmediği için kullanıcılar listede offline kalıyor.
- Kullanıcı kendi durumunu manuel değiştirince `track()` yeniden çalışıyor ve o anda görünüm düzeliyor; bu da bug’ı doğruluyor.

Uygulama yaklaşımı:
1. Presence durumunu kalıcı bir referansta tutma
- `Index.tsx` içinde `presenceStatusRef` (Map<userId, status>) eklenecek.
- Presence `sync` geldiğinde bu ref güncellenecek.

2. Üye listesini oluştururken presence bilgisini ref’ten uygulama
- `fetchMembers` içinde statü belirleme sırası:
  - önce `presenceStatusRef` (anlık doğru kaynak),
  - yoksa `prevMembers` status’u (mevcut koruma),
  - hiçbiri yoksa `offline`.
- Böylece `sync` önce gelmiş olsa bile, üyeler sonradan geldiğinde doğru çevrimiçi durumu hemen uygulanır.

3. Presence `sync` handler’ını tek kaynak haline getirme
- `sync` callback’i:
  - `presenceStatusRef`’i günceller,
  - `setMembers` ile ref’e göre statüleri immutable şekilde uygular.
- Mevcut davranış korunur ama artık initial race condition kırılır.

4. Abonelik sonrası kendi durumu için güvenli ilk yansıtma
- `SUBSCRIBED` sonrası `track({... status: myStatus })` devam eder.
- Ardından sadece kendisi için UI’de “offline kalma” riskini sıfırlamak adına:
  - `presenceStatusRef.current.set(user.id, myStatus)` güncellenecek,
  - üyeler yüklüyse `setMembers` ile kendi satırı güvenli biçimde güncellenecek.
- Bu adım diğer kullanıcıları bozmaz, sadece “ilk açılışta ben offline görünüyorum” kenar durumunu kapatır.

5. Sunucu değişiminde stale presence etkisini engelleme
- `activeServer` değişiminde üyeler yeniden çekilirken status hesaplaması her zaman yeni `memberRows` + `presenceStatusRef` ile yapılır.
- Böylece önceki sunucudan kalan eski `members` state’i yanlış etki etmez.

Dosya bazlı değişiklik:
- `src/pages/Index.tsx` (tek dosya)
  - yeni ref: `presenceStatusRef`
  - `fetchMembers` içindeki status hesaplama düzeni
  - presence `sync` callback’inde ref güncelleme + members apply
  - `SUBSCRIBED`/`myStatus` akışında kendi kullanıcı durumu için güvenli ilk yansıtma

Neden bu çözüm doğru:
- Sorun DB/RLS değil; ağ istekleri başarılı, üyeler ve profiller geliyor.
- Sorun istemci tarafında “presence event sırası vs üyeleri fetch etme sırası”.
- Presence state’i ref’te tutup üyeler yüklenirken uygulamak, event sırasından bağımsız deterministik sonuç üretir.

Doğrulama planı (uygulama sonrası):
1) Tek kullanıcı testi:
- Uygulamayı açar açmaz üye listesinde kendi durumunun online görünmesi.
- Sayfa yenilemeden offline’a düşmemesi.
2) Çoklu kullanıcı testi:
- İki hesapla aynı sunucuya girip her iki tarafta da anlık online görünüm doğrulaması.
- Bir kullanıcının sekmeyi kapatması/yeniden açması sonrası diğerinde durumun doğru güncellenmesi.
3) Durum değiştirme testi:
- Online/Idle/DND/Görünmez değişiklikleri her iki tarafta da gerçek zamanlı yansıyor mu.
4) Regresyon:
- Emoji tepki, mesaj gönderme/düzenleme/silme akışlarının etkilenmediğinin hızlı kontrolü.

Risk ve önlem:
- Risk: presence ref ile members state arasında geçici tutarsızlık.
- Önlem: status hesaplamasında tek öncelik sırası (presence ref > prev status > offline) ve tüm güncellemeleri immutable yapmak.
