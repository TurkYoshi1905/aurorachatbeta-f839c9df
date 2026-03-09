import { Sparkles, Bug, Wrench } from 'lucide-react';

export interface ChangelogSection {
  title: string;
  icon: typeof Sparkles;
  color: string;
  items: string[];
}

export interface ChangelogRelease {
  version: string;
  date: string;
  summary: string;
  sections: ChangelogSection[];
}

export const changelogData: ChangelogRelease[] = [
  {
    version: '0.2.5',
    date: '9 Mart 2026',
    summary: 'Dosya ekleri (Discord tarzı embed), AuroraChat Premium sistemi, mobil ayarlar yeniden tasarımı ve profil kartı düzeltmesi.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Dosya Ekleri: Tüm dosya türleri destekleniyor, Discord tarzı embed görünümü',
          'Dosya indirme güvenlik uyarısı ve "bir daha gösterme" seçeneği',
          'AuroraChat Premium: Basic (10 TL/ay) ve Premium (30 TL/ay) üyelik planları',
          'Mobil ayarlar Discord tarzı dikey liste + alt sayfa + geri butonu',
          'Profil kartı gerçek zamanlı durum gösterimi düzeltildi',
        ],
      },
    ],
  },
  {
    version: '0.2.4',
    date: '9 Mart 2026',
    summary: 'Filtreli mesaj arama, kanal bazlı bildirim ayarları ve gerçek zamanlı bildirim geçmişi.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Filtreli Mesaj Arama: Gönderen, tarih aralığı, içerik türü (dosya/link/sabitlenmiş) ve kanal bazlı arama',
          'Bildirim Ayarları: Kanal bazlı bildirim seviyesi (tümü/etiketlemeler/kapalı)',
          'Kanal Susturma: 15dk, 1sa, 8sa, 24sa veya süresiz susturma seçenekleri',
          '@everyone/@here bastırma toggle\'ı',
          'Bildirim Geçmişi: Etiketlemeler, yanıtlar ve sabitleme bildirimleri gerçek zamanlı',
          'Okunmamış bildirim sayacı ve tümünü okundu işaretle butonu',
        ],
      },
    ],
  },
  {
    version: '0.2.3',
    date: '9 Mart 2026',
    summary: 'Mobil menü başlığı düzeltmesi, bildirim izni, boşta ay ikonu ve profil kartı tarih lokalizasyonu.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Bildirim izni: Uygulama açılışında tarayıcı bildirimi izni isteniyor',
          'Boşta durumu ay ikonu ile gösteriliyor (kullanıcı paneli + üye listesi + profil kartı)',
          'Arka plan algılama: Uygulama arka plana alındığında otomatik boşta durumuna geçiş',
          'Profil kartında tarihler seçili dile göre lokalize ediliyor',
          'Profil kartında gerçek zamanlı durum gösterimi',
        ],
      },
      {
        title: 'Düzeltmeler',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Mobil mesaj menüsündeki "chat.messageActions" çeviri hatası düzeltildi',
        ],
      },
    ],
  },
  {
    version: '0.2.2',
    date: '8 Mart 2026',
    summary: 'Mobil mesaj uzun basma menüsü, pürüzsüz lightbox geçişleri ve profil kartı mobil düzeltmesi.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Mobil Mesaj Menüsü: Mesaja uzun basarak Discord tarzı aksiyon menüsü aç',
          'Hızlı tepki ekleme, yanıtlama, düzenleme ve silme tek yerden',
          'Lightbox resim geçişlerinde pürüzsüz fade animasyonu',
          'Lightbox buton yazıları artık mobilde de her zaman görünür',
        ],
      },
      {
        title: 'Düzeltmeler',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Profil kartı mobilde ekranın dışına taşma sorunu düzeltildi (Sheet olarak açılıyor)',
          'Mobilde mesaj aksiyon butonlarının görünmeme sorunu giderildi',
        ],
      },
    ],
  },
  {
    version: '0.2.1',
    date: '8 Mart 2026',
    summary: 'Sunucu özel emoji sistemi, gelişmiş rol renk seçici ve detaylı yetkilendirme.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Özel Emoji Sistemi: Sunucunuza 50 adede kadar özel emoji yükleyin',
          'Sohbette :emoji_adi: yazarak özel emojileri kullanın',
          'Emoji Seçici\'de sunucu emojileri ayrı sekmede gösterilir',
          'Emoji yönetimi: İsim düzenleme, tekli ve toplu silme',
          'HEX Renk Seçici: Roller için sınırsız renk seçeneği',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Yönetici (Administrator) yetkisi: Aktif olunca tüm izinler otomatik açılır',
          'Yeni yetki türleri: Sunucu yönetimi, dosya ekleme, emoji yönetimi, mesaj gönderme',
          'Yetki açıklamaları ile daha anlaşılır izin paneli',
          'Emoji görselleri otomatik boyutlandırılarak performans optimize edildi',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    date: '8 Mart 2026',
    summary: 'Thread/Konu sistemi, Discord benzeri rol izinleri ve gelişmiş kullanıcı profil kartı.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Thread (Konu) Sistemi: Herhangi bir mesajdan konu başlat, sağ panelde yanıtla',
          'Mesaj altında yanıt sayısı gösterimi ve tıklayarak konuya giriş',
          'Rol İzin Sistemi: Discord benzeri izin toggle\'ları ile detaylı yetki yönetimi',
          'İzin kategorileri: Kanal yönetimi, üye atma/yasaklama, mesaj silme/sabitleme',
          'Gelişmiş Profil Kartı: Banner rengi, hakkımda bölümü, özel not alanı',
          'Profil kartından direkt mesaj gönderme butonu',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Rol izinleri artık pin, delete ve kick aksiyonlarını kontrol ediyor',
          'Profil tablosuna bio ve banner_color sütunları eklendi',
          'Tüm çeviri dosyaları (6 dil) thread ve profil kartı için güncellendi',
        ],
      },
    ],
  },
  {
    version: '0.1.9',
    date: '8 Mart 2026',
    summary: 'Mesaj yanıtlama, mesaj sabitleme ve kullanıcı profil kartı.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Mesaj Yanıtlama (Reply): Herhangi bir mesajı yanıtla, referans olarak üstte göster',
          'Yanıtlanan mesaja tıklayarak orijinal mesaja anında kaydır',
          'Mesaj Sabitleme (Pin): Sunucu sahipleri önemli mesajları sabitleyebilir',
          'Sabitlenmiş mesajlar paneli: Pin ikonuna tıklayarak tüm sabitlenmiş mesajları listele',
          'Kullanıcı Profil Kartı: Mesaj yazarına veya üye listesine tıklayarak detaylı profil görüntüle',
          'Profil kartında roller, katılım tarihi ve avatar gösterimi',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Tüm çeviri dosyaları (6 dil) yeni özellikler için güncellendi',
          'Mesaj hover aksiyonlarına Yanıtla ve Sabitle butonları eklendi',
        ],
      },
    ],
  },
  {
    version: '0.1.8',
    date: '8 Mart 2026',
    summary: 'Çok adımlı kayıt, şifre sıfırlama, emoji arama düzeltmesi, 2FA ve gizlilik güncellemesi.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Çok adımlı kayıt paneli: İsim → Doğum Tarihi → Profil Fotoğrafı → Şifre → E-posta',
          'Doğum tarihi doğrulaması: 13 yaşından küçük kullanıcılar kayıt olamaz',
          'Kayıt sırasında profil fotoğrafı yükleme ve önizleme',
          'Şifremi Unuttum: E-posta ile şifre sıfırlama bağlantısı',
          'İki Faktörlü Doğrulama (2FA): TOTP QR kodu ile hesap güvenliği',
        ],
      },
      {
        title: 'Düzeltmeler',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Emoji arama sistemi keyword tabanlı filtreleme ile tamamen yeniden yazıldı',
          'Arama sonuçları artık doğru filtreleniyor (smile, heart, fire vb.)',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Gizlilik politikası: Yaş sınırı, bildirim izinleri ve 2FA maddeleri eklendi',
          'Bildirim sistemi: @mention etiketlemelerinde masaüstü bildirimleri',
          'Giriş sayfasına "Şifremi Unuttum" bağlantısı eklendi',
        ],
      },
    ],
  },
  {
    version: '0.1.7',
    date: '8 Mart 2026',
    summary: 'Mobil mesaj çubuğu yenilendi, safe area desteği ve kullanıcı paneli optimizasyonu.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Mobil mesaj yazma alanı tamamen yenilendi (Discord Mobile tarzı)',
          'Emoji ikonu artık input alanının içinde, sağ tarafta sabitlendi',
          'Mobil "+" menüsü: Resim Ekle ve GIF Gönder seçenekleri tek butondan erişilebilir',
          'Gönder butonu mobilde her zaman görünür (yuvarlak ok simgesi)',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Mobil Safe Area desteği: Home Indicator\'a çarpmayan alt bar',
          'Kullanıcı bilgi paneli mobil ekranlar için optimize edildi',
          'Ses ayarları dropdown ok simgelerinin dokunma alanı genişletildi',
        ],
      },
      {
        title: 'Düzeltmeler',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Mobilde ikon taşma sorunu tamamen giderildi',
          'Emoji ikonu artık mesaj kutusu dışına taşmıyor',
          'Klavye açıldığında mesaj çubuğunun konumu korunuyor',
        ],
      },
    ],
  },
  {
    version: '0.1.6',
    date: '8 Mart 2026',
    summary: 'AuroraChat Bot, slash komutları, kanal kilitleme ve sesli sohbet stabilizasyonu.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'AuroraChat Bot: Her sunucuya entegre edilmiş akıllı bot asistanı',
          'Slash komutları: /help, /info, /list, /lock, /unlock, /kick, /ban, /timeout ve daha fazlası',
          'Kanal kilitleme: /lock komutuyla kanalları anında kilit altına alabilirsin',
          'Kullanıcı yasaklama ve susturma sistemi eklendi',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Sesli sohbet altyapısı LiveKit SDK ile yeniden stabilize edildi',
          'Sesli kanallarda konuşma animasyonu eklendi',
          'Bot mesajları özel arayüzle (BOT etiketi) gösteriliyor',
          'Slash komut öneri popup\'ı: / yazarken otomatik tamamlama',
        ],
      },
      {
        title: 'Düzeltmeler',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Ses kanalı bağlantı hata yönetimi ve otomatik yeniden deneme eklendi',
          'Üye listesi ve kullanıcı etiketleme sistemindeki senkronizasyon hataları giderildi',
        ],
      },
    ],
  },
  {
    version: '0.1.5',
    date: '8 Mart 2026',
    summary: 'Navigasyon döngüsü düzeltmeleri, kanal yönetimi iyileştirmeleri ve sesli sohbet stabilitesi.',
    sections: [
      {
        title: 'Düzeltmeler',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Ayarlar sayfasına girerken oluşan sonsuz yükleme ekranı döngüsü (Splash Screen Loop) giderildi',
          'Sunucu ayarlarında kanalların kategorilere sürüklenememesi sorunu çözüldü',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Uygulama içi navigasyon hızı artırıldı; sayfalar arası geçiş artık anlık',
          'Kanal ve kategori hiyerarşisi, görsel olarak daha anlaşılır hale getirildi',
          'Sesli kanallar arası geçişte eski bağlantı temizlenerek stabilite artırıldı',
        ],
      },
    ],
  },
  {
    version: '0.1.4',
    date: '8 Mart 2026',
    summary: 'WebRTC sesli sohbet, kanal kategorileri, @etiketleme ve akıllı yükleme ekranı.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'WebRTC tabanlı, düşük gecikmeli sesli sohbet kanalları eklendi (LiveKit)',
          'Sunucu ayarlarında sürükle-bırak kanal yönetimi ve kategori sistemi aktif',
          '@Etiketleme özelliği: mesajlarda sunucu üyelerini etiketleyebilirsiniz',
          'Akıllı yükleme ekranı (Splash Screen) ile uygulama stabilitesi artırıldı',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Ses kanallarında konuşan kişinin avatarı yeşil halka ile gösteriliyor',
          'Kanal kategorileri: metin ve ses kanallarını gruplandırabilirsiniz',
          'Etiketlenen kullanıcılar bildirim alıyor',
          'Yükleme ekranı tüm veriler hazır olana kadar ana ekrana geçişi engelliyor',
        ],
      },
    ],
  },
  {
    version: '0.1.3',
    date: '8 Mart 2026',
    summary: 'Discord estetiği, ses kontrolleri, güvenli hesap silme, tema seçici ve DM arayüz iyileştirmeleri.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Mikrofon ve kulaklık toggle: kapatıldığında kırmızı çizgili ikon gösterimi',
          'Cihaz seçimi: Giriş/Çıkış cihazları Popover ile listelenip seçilebiliyor',
          'Güvenli hesap silme: mesajlar anonim korunur, profil ve auth kaydı silinir',
          'Tema seçici: Koyu / Açık / Sistem modları Görünüm ayarlarına eklendi',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'DM ana sayfası boş durum illüstrasyonu yenilendi (gradient ikon + modern tipografi)',
          'User Info paneli ChannelList\'ten ayrı bileşen olarak çıkarıldı ve DM sayfasına da entegre edildi',
          'DM listesinde hover efektleri ve X butonu daha belirgin hale getirildi',
          'Mesaj çubuğu ikon sıralaması Discord\'a uygun düzenlendi: [+] [input] [Resim] [GIF] [Emoji] [Gönder]',
          'GIF ve dosya ekleme ikonları artık mobilde de görünüyor',
          'Düzenleme butonları (pencil) modern rounded-lg bg-secondary/50 stili ile güncellendi',
        ],
      },
    ],
  },
  {
    version: '0.1.2',
    date: '8 Mart 2026',
    summary: 'Discord tarzı gelişmiş medya görüntüleyici: zoom, pan, swipe galeri ve GIF lightbox desteği.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Discord tarzı tam ekran lightbox: mouse tekerleği ile yakınlaştırma (1x–5x) ve sürükleme desteği',
          'Mobil pinch-to-zoom ve tek parmak sürükleme ile görsel inceleme',
          'Galeri modu: ok tuşları ve mobil swipe ile sohbetteki görseller arasında geçiş',
          'GIF görselleri artık lightbox içinde büyük boyutta açılıyor',
          '"Orijinali Aç" ve "İndir" butonları lightbox alt barına eklendi',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Lightbox arka planı derin bulanıklık (backdrop-blur-xl) efekti ile karartıldı',
          'Çift tıklama ile zoom toggle, sıfırlama ve klavye kısayolları (+/-/0) eklendi',
          'Zoom aktifken galeri navigasyonu devre dışı bırakılarak yanlış geçiş engellendi',
        ],
      },
    ],
  },
  {
    version: '0.1.1',
    date: '8 Mart 2026',
    summary: 'Gelişmiş rol sistemi, Discord tarzı davet UI, emoji/GIF desteği ve tam sayfa sunucu ayarları.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Discord stili gelişmiş davet linki oluşturma ve yönetme sistemi eklendi',
          'Rol oluşturma, renk atama ve kullanıcıya rol verme özelliği aktif',
          'Tenor GIF ve Emoji picker desteği ile sohbetler renklendirildi',
          'Denetim Kaydı (Audit Log): Sunucu içi tüm aksiyonlar kayıt altına alınıyor',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'DM senkronizasyon hataları ve 500 hataları tamamen giderildi',
          'DM kanalları CHANNEL_ERROR durumunda otomatik yeniden bağlanıyor',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Sunucu ayarları daha geniş kullanım için tam sayfa yapısına geçirildi',
          'Üye listesinde roller renkli kategoriler halinde gösteriliyor',
          'Davet sistemi: süre sona erme ve maksimum kullanım sayısı ayarlanabiliyor',
          'Tüm sunucu üyeleri davet oluşturabiliyor (sadece sahip değil)',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '3 Mart 2026',
    summary: 'Çok dilli destek sistemi ve uygulama genelinde lokalizasyon.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Çok Dilli Destek: Türkçe, İngilizce, Azerbaycan, Rusça, Japonca, Almanca',
          'Ayarlar sayfasına "Görünüm ve Dil" sekmesi eklendi',
          'Dil seçimi kullanıcı profiline kaydedilir ve oturumlar arasında korunur',
          'Uygulama genelindeki tüm metinler (menüler, butonlar, uyarılar, dialoglar) dinamik hale getirildi',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Lightweight i18n sistemi: React Context + TypeScript çeviri dosyaları ile harici kütüphane bağımlılığı olmadan',
          'Dil değişikliği anında uygulanır (sayfa yenileme ile)',
        ],
      },
    ],
  },
  {
    version: '0.0.9',
    date: '3 Mart 2026',
    summary: 'Tam gerçek zamanlı DM sistemi, profil senkronizasyonu ve gizlilik özellikleri.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Tam Gerçek Zamanlı DM Sistemi (Sayfa yenileme zorunluluğu kaldırıldı)',
          'Profil bilgilerinin (Ad/Kullanıcı adı) tüm platformda anlık senkronizasyonu',
          'DM Mesaj Düzenleme ve Silme özellikleri eklendi',
          'Yeni Gizlilik Politikası sayfası ve Geri Dön butonu eklendi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Sunucu davet linklerindeki görsel hataları giderildi',
          'Changelog navigasyon döngüsü düzeltildi',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Gizlilik ve Güvenlik ayarları (DM izni, arkadaşlık istekleri yönetimi, 2FA UI)',
          'Sunucu ikonu render mantığı iyileştirildi',
        ],
      },
    ],
  },
  {
    version: '0.0.8',
    date: '2 Mart 2026',
    summary: 'UI modernizasyonu, dinamik changelog sistemi ve mobil bottom navigation bar.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Dinamik sürüm notları sistemi (/changelog sayfası)',
          'Mobil bottom navigation bar eklendi',
          '100 sunucu limiti ve sabit alt butonlar',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'DM ve kanal mesajlarında realtime sorunları giderildi',
        ],
      },
      {
        title: 'Geliştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Tüm sayfalar mobil cihazlar için optimize edildi',
          'UI modernizasyonu: rounded-xl, tutarlı spacing',
        ],
      },
    ],
  },
  {
    version: '0.0.7',
    date: '2 Mart 2026',
    summary: 'Gelişmiş davet sistemi ve embed önizleme iyileştirmeleri.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Gelişmiş davet sistemi: sunucu üyesi olmayan kullanıcılar da davet linklerini ve sunucu bilgilerini görebiliyor',
          'Embed önizleme iyileştirmeleri: davet kartları tüm kullanıcılar için çalışıyor',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Davet linkleri misafir kullanıcılar için artık "Geçersiz" dönmüyor',
          'Ana sayfa (home) seçiliyken oluşan 400 hataları giderildi',
        ],
      },
    ],
  },
  {
    version: '0.0.6',
    date: '2 Mart 2026',
    summary: 'DM sistemi, arkadaşlık sistemi ve yazıyor göstergesi.',
    sections: [
      {
        title: 'Yeni Özellikler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'DM (Direkt Mesajlaşma) sistemi eklendi — arkadaşlarla özel sohbet',
          'Arkadaşlık sistemi: kullanıcı adı ile istek gönderme, kabul/reddetme',
          'Arkadaş listesi sekmeleri: Tümü, Bekleyen İstekler, Arkadaş Ekle',
          'Discord stili gerçek zamanlı "yazıyor..." göstergesi eklendi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Emoji tepkileri realtime senkronizasyonu düzeltildi — kendi aksiyonlarınız artık çift sayılmıyor',
        ],
      },
    ],
  },
  {
    version: '0.0.5',
    date: '2 Mart 2026',
    summary: 'Emoji tepkileri ve presence sistemi düzeltmeleri.',
    sections: [
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Emoji tepkileri artık anında güncelleniyor — sayfa yenilemeye gerek kalmadan ekleme/kaldırma yapılabiliyor',
          'Kullanıcılar uygulamaya giriş yaptığında artık çevrimiçi olarak doğru görünüyor',
          'Diğer kullanıcıların çevrimiçi durumu artık gerçek zamanlı olarak doğru yansıyor',
        ],
      },
      {
        title: 'Küçük İyileştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Emoji tepkilerinde optimistik güncelleme — anlık UI yanıtı',
          'Presence sistemi yeniden yapılandırıldı — yarış durumu (race condition) giderildi',
        ],
      },
    ],
  },
  {
    version: '0.0.4',
    date: '1 Mart 2026',
    summary: 'Emoji tepkileri ve mesaj düzenleme.',
    sections: [
      {
        title: 'Güncellemeler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Mesajlara emoji tepki özelliği eklendi (Discord tarzı)',
          'Emoji tepkileri gerçek zamanlı olarak tüm kullanıcılara yansıyor',
          'Mesaj düzenleme özelliği eklendi — kullanıcılar kendi mesajlarını düzenleyebilir',
          'Düzenlenen mesajlarda "(Düzenlendi)" etiketi gösteriliyor',
        ],
      },
      {
        title: 'Küçük İyileştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Mesaj zaman formatı GG.AA.YYYY SS:DD olarak güncellendi',
          'Emoji seçici popover ile kolay erişim sağlandı',
          'Tepki toggle mantığı: aynı emojiye tekrar tıklayınca tepki kaldırılıyor',
        ],
      },
    ],
  },
  {
    version: '0.0.3',
    date: '28 Şubat 2026',
    summary: 'Mesaj silme, sunucu yönetimi ve üye atma.',
    sections: [
      {
        title: 'Güncellemeler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Kullanıcılar kendi mesajlarını silebilir',
          'Sunucu sahipleri herhangi bir mesajı silebilir',
          'Üyeler sunucudan ayrılabilir',
          'Sunucu sahipleri üyeleri atabilir',
          'Sunucu ayarları (ad, simge güncelleme) eklendi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Mobil arayüzde sohbet alanı kaydırma sorunu giderildi',
          'Üye atıldığında üye listesinin güncellenmeme sorunu düzeltildi',
        ],
      },
    ],
  },
  {
    version: '0.0.2',
    date: '25 Şubat 2026',
    summary: 'Profil fotoğrafı, link embed ve kanal oluşturma.',
    sections: [
      {
        title: 'Güncellemeler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Profil fotoğrafı yükleme özelliği eklendi',
          'Mesajlardaki linkler için Discord tarzı embed önizleme eklendi',
          'Kanal oluşturma artık gerçek zamanlı olarak diğer üyelere yansıyor',
        ],
      },
      {
        title: 'Küçük İyileştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Sunucu yükleme hızı optimize edildi',
          'Avatar görüntüleme tüm bileşenlere entegre edildi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Kanal listesi gerçek zamanlı güncellenmeme sorunu giderildi',
        ],
      },
    ],
  },
  {
    version: '0.0.1',
    date: '25 Şubat 2026',
    summary: 'İlk sürüm: sunucu, mesajlaşma ve davet sistemi.',
    sections: [
      {
        title: 'Güncellemeler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Sunucu oluşturma ve katılma sistemi eklendi',
          'Davet linki oluşturma ve paylaşma özelliği eklendi',
          'Gerçek zamanlı mesajlaşma altyapısı kuruldu',
          'Kullanıcı durumu (çevrimiçi/meşgul/rahatsız etmeyin) desteği eklendi',
          'Güncelleme notları sayfası eklendi',
        ],
      },
      {
        title: 'Küçük İyileştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Sunucular artık sadece üyelere görünür (Discord benzeri)',
          'Mobil arayüz iyileştirmeleri yapıldı',
          'Ayarlar sayfası responsive tasarımı güncellendi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Farklı hesaplardan sunucu görünürlük sorunu düzeltildi',
          'Kanal listesi sıralama hatası giderildi',
        ],
      },
    ],
  },
];
