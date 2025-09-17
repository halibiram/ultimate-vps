# Ultimate VPN Sunucu Kurulum Scripti

Bu script, Debian-tabanlı Linux sunucularında kapsamlı ve yüksek performanslı bir VPN sunucusu kurulumunu otomatikleştirmek için tasarlanmıştır. "Ultimate Mode" seçenekleri ile farklı ihtiyaçlara yönelik optimize edilmiş kurulumlar sunar. Script, özellikle WhatsApp gibi uygulamalar için trafik gizleme ve bypass tekniklerine odaklanmıştır.

## 🚀 Temel Özellikler

- **Çoklu VPN Protokolü Desteği:**
  - WireGuard (Yüksek Hız)
  - Xray (VLESS + Reality ile Gelişmiş Gizlilik)
  - Hysteria2 (Yüksek Performanslı UDP)
  - TUIC v5 (Yüksek Hızlı UDP)
  - Sing-Box (Çoklu Protokol Desteği)
  - SSH-TLS Tünelleme (Stunnel + Dropbear ile esnek bypass)
- **Ultimate Sistem Optimizasyonu:**
  - XanMod Yüksek Performans Kernel (isteğe bağlı)
  - BBRv2 Tıkanıklık Kontrolü
  - Gelişmiş `sysctl` ağ ve kernel ayarları
  - Artırılmış dosya tanımlayıcı ve process limitleri
- **Gelişmiş Güvenlik ve Gizlilik:**
  - **Let's Encrypt Entegrasyonu:** Alan adınız için otomatik olarak geçerli SSL sertifikaları alır ve yeniler.
  - **Performans Odaklı SSH-TLS:** SSH tünel performansı, daha hızlı şifrelemeler ve ağ ayarları ile optimize edilmiştir.
  - **Multi-SNI Domain Fronting:** Trafiği popüler web siteleri (Google, Amazon, vb.) arkasına gizler.
  - **XTLS-Reality:** Gelişmiş sansür sistemlerine karşı sunucu parmak izini ortadan kaldırır.
  - **gRPC Desteği:** Xray için ek bir transport protokolü sunarak gizliliği artırır.
  - **AdGuard Home:** Reklam ve izleyici engelleme için DNS-over-HTTPS sunucusu.
- **Otomatik Kurulum ve Yönetim:**
  - **Kullanıcı Yönetimi:** `vpn-manager` komutu ile kolayca Xray kullanıcısı ekleyin, silin ve listeleyin.
  - **Otomatik Raporlama:** Kurulum sonunda tüm bağlantı bilgilerini içeren detaylı bir rapor oluşturur.
  - **Performans Takibi:** `vpn-monitor` komutu ile sunucu durumunu izleyin.

## 🛠️ Kullanım

Script'i kullanmak için sunucunuza indirin, çalıştırılabilir yapın ve `sudo` yetkileriyle çalıştırın.

```bash
# Script'i indirin (URL'yi kendi reponuzla değiştirin)
# wget https://example.com/setup.sh

# Çalıştırma izni verin
chmod +x setup.sh

# Root yetkileriyle çalıştırın
sudo ./setup.sh
```

Script, kurulumun başında size SSL sertifikası için bir alan adı kullanmak isteyip istemediğinizi soracaktır. Eğer bir alan adınız varsa ve bunu sunucunun IP adresine yönlendirdiyseniz, `y` seçeneği ile devam ederek Let's Encrypt üzerinden geçerli bir SSL sertifikası alabilirsiniz.

Daha sonra, size bir dizi "Ultimate Mode" seçeneği sunulacaktır.

## ⚡ Ultimate Mode Seçenekleri

1.  **🏃 Speed Demon:** Maksimum hız odaklıdır. WireGuard, Hysteria2 ve sistem optimizasyonlarını kurar.
2.  **🥷 Stealth Master:** Maksimum gizlilik ve sansür atlatma odaklıdır. Xray (Reality), TUIC, SSH-TLS ve AdGuard DNS kurar.
3.  **⚡ Hybrid Beast:** Hız ve gizliliği birleştirir. WireGuard, Xray, Hysteria2, SSH-TLS ve sistem optimizasyonlarını içerir.
4.  **🛠️ Custom Ultimate:** Hangi bileşenlerin kurulacağını tek tek seçmenize olanak tanır.
5.  **🚀 MAXIMUM OVERDRIVE:** **Tavsiye edilen moddur.** Tüm özellikleri, XanMod kernel yükseltmesini ve bütün optimizasyonları içerir.

## 📄 Kurulum Sonrası Bilgiler

Kurulum tamamlandıktan sonra, tüm önemli bilgiler ve istemci yapılandırmaları sunucunuzda ilgili dosyalara kaydedilir.

- **Ana Rapor:** Tüm servislerin özetini, IP adresini ve temel bilgileri içeren rapor `/root/ultimate-vpn-report.txt` dosyasında bulunur.
- **İstemci Yapılandırmaları:** Her servisin istemci yapılandırma dosyası, rapor dosyasında ve ilgili servislerin kurulum dizinlerinde belirtilmiştir (örn: `/etc/xray/`, `/etc/hysteria/` vb.).

## ⚙️ Yönetim ve İzleme

Kurulum sonrası sunucunuzu yönetmek ve izlemek için aşağıdaki komutları kullanabilirsiniz.

### Kullanıcı Yönetimi

Xray (VLESS) kullanıcılarını kolayca yönetmek için `vpn-manager` komutunu kullanın:

```bash
sudo vpn-manager
```

Bu komut size aşağıdaki seçenekleri sunan interaktif bir menü açacaktır:
- Yeni kullanıcı ekleme
- Mevcut bir kullanıcıyı silme
- Tüm kullanıcıları listeleme

### Performans İzleme

Sunucunuzun anlık performansını ve VPN servislerinin durumunu kontrol etmek için:

```bash
vpn-monitor
```

Bu komut, CPU/RAM kullanımı, ağ istatistikleri ve aktif servisler hakkında hızlı bir genel bakış sunar.
