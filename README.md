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
  - **Multi-SNI Domain Fronting:** Trafiği popüler web siteleri (Google, Amazon, vb.) arkasına gizler.
  - **WhatsApp Bypass:** Trafiği `web.whatsapp.com` gibi göstererek DPI (Derin Paket İncelemesi) sistemlerini atlatır.
  - **XTLS-Reality:** Gelişmiş sansür sistemlerine karşı sunucu parmak izini ortadan kaldırır.
  - **AdGuard Home:** Reklam ve izleyici engelleme için DNS-over-HTTPS sunucusu.
- **Otomatik Kurulum ve Raporlama:**
  - UFW Firewall ve QoS (Quality of Service) kurallarını otomatik yapılandırır.
  - Kurulum sonunda tüm bağlantı bilgilerini içeren detaylı bir rapor oluşturur.
  - Performans takibi için `vpn-monitor` komutunu sunar.

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

Script çalıştırıldığında, size bir dizi "Ultimate Mode" seçeneği sunacaktır.

## ⚡ Ultimate Mode Seçenekleri

1.  **🏃 Speed Demon:** Maksimum hız odaklıdır. WireGuard, Hysteria2 ve sistem optimizasyonlarını kurar.
2.  **🥷 Stealth Master:** Maksimum gizlilik ve sansür atlatma odaklıdır. Xray (Reality), TUIC, SSH-TLS ve AdGuard DNS kurar.
3.  **⚡ Hybrid Beast:** Hız ve gizliliği birleştirir. WireGuard, Xray, Hysteria2, SSH-TLS ve sistem optimizasyonlarını içerir.
4.  **🛠️ Custom Ultimate:** Hangi bileşenlerin kurulacağını tek tek seçmenize olanak tanır.
5.  **🚀 MAXIMUM OVERDRIVE:** **Tavsiye edilen moddur.** Tüm özellikleri, XanMod kernel yükseltmesini ve bütün optimizasyonları içerir.

## 📄 Kurulum Sonrası

Kurulum tamamlandıktan sonra, tüm önemli bilgiler ve istemci yapılandırmaları sunucunuzda ilgili dosyalara kaydedilir.

- **Ana Rapor:** Tüm servislerin özetini, IP adresini ve temel bilgileri içeren rapor `/root/ultimate-vpn-report.txt` dosyasında bulunur.
- **İstemci Yapılandırmaları:**
  - **WireGuard:** `/etc/wireguard/client-ultimate.conf` (QR kodu: `/etc/wireguard/client-ultimate-qr.png`)
  - **Xray:** `/etc/xray-ultimate-configs.txt`
  - **Hysteria2:** `/etc/hysteria/client-ultimate.yaml`
  - **TUIC:** `/etc/tuic/client.json`
  - **Sing-Box:** `/etc/sing-box/client-configs.txt`
  - **SSH-TLS:** Örnek yapılandırmalar ve helper script'ler `/etc/ssh-tls-configs/` ve `/usr/local/bin/` altında bulunur.
- **AdGuard Home Arayüzü:** `https://<SUNUCU_IP>:3000`

## 📊 Performans İzleme

Sunucunuzun anlık performansını ve VPN servislerinin durumunu kontrol etmek için aşağıdaki komutu kullanabilirsiniz:

```bash
vpn-monitor
```

Bu komut, CPU/RAM kullanımı, ağ istatistikleri ve aktif servisler hakkında hızlı bir genel bakış sunar.
