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
