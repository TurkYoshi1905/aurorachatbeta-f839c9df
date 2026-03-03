import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>

        <h1 className="text-3xl font-bold mb-2">Gizlilik Politikası</h1>
        <p className="text-sm text-muted-foreground mb-8">Son güncelleme: 3 Mart 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-secondary-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Genel Bakış</h2>
            <p>
              Aurora Chat olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu politika, uygulamamızı
              kullanırken hangi verilerin toplandığını, nasıl işlendiğini ve korunduğunu açıklamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Toplanan Veriler</h2>
            <p className="mb-3">Hizmetlerimizi sunabilmek için aşağıdaki verileri toplamaktayız:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong className="text-foreground">E-posta Adresi:</strong> Hesap oluşturma, kimlik doğrulama ve
                gerekli bildirimlerin gönderimi amacıyla kullanılır.
              </li>
              <li>
                <strong className="text-foreground">Profil Bilgileri:</strong> Görünen ad, kullanıcı adı ve profil
                fotoğrafı gibi bilgiler, diğer kullanıcılarla etkileşiminizi sağlamak için toplanır.
              </li>
              <li>
                <strong className="text-foreground">Mesaj İçerikleri:</strong> Sunucu ve direkt mesajlarınız,
                iletişim hizmetinin sağlanması için şifreli olarak saklanır.
              </li>
              <li>
                <strong className="text-foreground">IP Adresi:</strong> Güvenlik, kötüye kullanım önleme ve
                hizmet iyileştirme amacıyla kaydedilir.
              </li>
              <li>
                <strong className="text-foreground">Kullanım İstatistikleri:</strong> Uygulama performansını
                iyileştirmek ve kullanıcı deneyimini optimize etmek amacıyla anonim kullanım verileri toplanır.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Verilerin Kullanımı</h2>
            <p>Topladığımız veriler yalnızca aşağıdaki amaçlarla kullanılır:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Hesabınızın oluşturulması ve yönetilmesi</li>
              <li>Mesajlaşma hizmetinin sağlanması</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
              <li>Hizmet kalitesinin iyileştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Veri Güvenliği</h2>
            <p>
              Verileriniz endüstri standardı güvenlik protokolleri ile korunmaktadır. Tüm veri iletişimi SSL/TLS
              şifrelemesi ile gerçekleştirilir. Veritabanlarımız düzenli olarak yedeklenir ve erişim kontrolleri
              ile korunur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Üçüncü Taraf Paylaşımı</h2>
            <p>
              Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Hizmet
              sağlayıcılarımız (altyapı, barındırma) ile paylaşılan veriler, yalnızca hizmetin sağlanması
              amacıyla ve gizlilik sözleşmeleri kapsamında işlenir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Kullanıcı Hakları</h2>
            <p>Aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Verilerinize erişim talep etme</li>
              <li>Verilerinizin düzeltilmesini isteme</li>
              <li>Verilerinizin silinmesini talep etme</li>
              <li>Veri işlemeye itiraz etme</li>
              <li>Hesabınızı kapatma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. İletişim</h2>
            <p>
              Gizlilik politikamız hakkında sorularınız için uygulama içi destek kanalımız aracılığıyla
              bizimle iletişime geçebilirsiniz.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
