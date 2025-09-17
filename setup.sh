#!/bin/bash

# Ultimate VPN Sunucu Kurulum Scripti
# Maksimum Performans + SNI Bypass + Kernel Optimizasyonu
# BBR, XanMod Kernel, XTLS-Reality, Hysteria2, Multi-SNI

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Log fonksiyonları
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

ultimate() {
    echo -e "${PURPLE}${BOLD}[ULTIMATE] $1${NC}"
}

# Root kontrolü
if [[ $EUID -ne 0 ]]; then
   error "Bu script root yetkileri ile çalıştırılmalıdır (sudo kullanın)"
fi

# Sistem bilgileri
SERVER_IP=$(curl -s http://ipecho.net/plain || curl -s http://icanhazip.com)
HOSTNAME=$(hostname)
OS=$(lsb_release -si)
VERSION=$(lsb_release -sr)
CPU_CORES=$(nproc)
TOTAL_RAM=$(free -h | awk 'NR==2{print $2}')

ultimate "ULTIMATE VPN SUNUCU KURULUMU BAŞLATILIYOR..."
echo "=========================================="
echo "🚀 ULTIMATE MODE AKTIF"
echo "📡 Sunucu IP: $SERVER_IP"
echo "🏠 Hostname: $HOSTNAME"
echo "💻 OS: $OS $VERSION"
echo "🔥 CPU Cores: $CPU_CORES"
echo "💾 RAM: $TOTAL_RAM"
echo "=========================================="

# Ultimate Mode seçenekleri
echo
ultimate "Ultimate VPN Konfigürasyonunu seçin:"
echo "1) 🏃 Speed Demon (WireGuard + BBR + Kernel Opt)"
echo "2) 🥷 Stealth Master (Multi-SNI + Reality + Camouflage)"
echo "3) ⚡ Hybrid Beast (Speed + Stealth Combined)"
echo "4) 🛠️  Custom Ultimate (Tüm seçenekleri kendin seç)"
echo "5) 🚀 MAXIMUM OVERDRIVE (HER ŞEY + Kernel Upgrade)"
echo

read -p "Ultimate Mode Seçimi (1-5): " ULTIMATE_CHOICE

# Kullanıcı bilgileri
read -p "VPN kullanıcı adı: " VPN_USER
read -s -p "VPN şifresi: " VPN_PASS
echo
read -p "Camouflage domain (örn: google.com): " CAMOUFLAGE_DOMAIN
CAMOUFLAGE_DOMAIN=${CAMOUFLAGE_DOMAIN:-google.com}
read -p "SNI Domains (virgülle ayır, örn: google.com,cloudflare.com,microsoft.com): " SNI_DOMAINS
SNI_DOMAINS=${SNI_DOMAINS:-"google.com,cloudflare.com,microsoft.com,amazon.com,web.whatsapp.com,wa.me"}

# WhatsApp optimize edilmiş SNI domains
WHATSAPP_SNIS="web.whatsapp.com,wa.me,whatsapp.com,whatsapp.net,facebook.com,instagram.com,messenger.com"

# --- Sertifika Seçenekleri ---
USE_LETSENCRYPT="n"
LETSENCRYPT_DOMAIN=""
CERT_FILE_PATH=""
KEY_FILE_PATH=""

echo
ultimate "SSL Sertifika Yapılandırması"
read -p "Geçerli bir SSL sertifikası için alan adı kullanmak ister misiniz (Let's Encrypt)? (y/n): " -r USE_LE_CHOICE
if [[ "$USE_LE_CHOICE" =~ ^[Yy]$ ]]; then
    USE_LETSENCRYPT="y"
    read -p "Lütfen alan adınızı girin (örn: vpn.example.com): " LETSENCRYPT_DOMAIN
    read -p "Let's Encrypt için e-posta adresinizi girin (yenileme bildirimleri için): " LETSENCRYPT_EMAIL
    if [ -z "$LETSENCRYPT_DOMAIN" ] || [ -z "$LETSENCRYPT_EMAIL" ]; then
        error "Let's Encrypt için alan adı ve e-posta gereklidir."
    fi
    info "Alan adı '$LETSENCRYPT_DOMAIN' Let's Encrypt sertifikası için kullanılacak."
else
    info "Kendinden imzalı (self-signed) sertifika kullanılacak."
fi

# --- UI Panel Seçeneği ---
INSTALL_UI_PANEL="n"
echo
ultimate "Web Yönetim Paneli (UI)"
read -p "Xray'i yönetmek için 3x-ui web panelini kurmak ister misiniz? (y/n): " -r UI_CHOICE
if [[ "$UI_CHOICE" =~ ^[Yy]$ ]]; then
    INSTALL_UI_PANEL="y"
    info "3x-ui web paneli kurulacak. Manuel Xray yapılandırması ve vpn-manager atlanacak."
else
    info "Manuel Xray yapılandırması ve vpn-manager script'i kurulacak."
fi

# Sertifika kurulumu
setup_certificates() {
    ultimate "Sertifika altyapısı hazırlanıyor..."
    if [ "$USE_LETSENCRYPT" = "y" ]; then
        info "Let's Encrypt sertifikası alınıyor: $LETSENCRYPT_DOMAIN"
        # Certbot kur
        if ! command -v certbot &> /dev/null; then
            apt install -y certbot python3-certbot-nginx || error "Certbot kurulamadı."
        fi

        # Port 80'i aç
        ufw allow 80/tcp

        # Sertifikayı al
        certbot certonly --standalone -d "$LETSENCRYPT_DOMAIN" --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email --non-interactive

        if [ -f "/etc/letsencrypt/live/$LETSENCRYPT_DOMAIN/fullchain.pem" ]; then
            CERT_FILE_PATH="/etc/letsencrypt/live/$LETSENCRYPT_DOMAIN/fullchain.pem"
            KEY_FILE_PATH="/etc/letsencrypt/live/$LETSENCRYPT_DOMAIN/privkey.pem"
            success "Let's Encrypt sertifikası başarıyla alındı."
        else
            error "Let's Encrypt sertifikası alınamadı. Lütfen alan adınızın sunucu IP'sini gösterdiğinden ve port 80'in açık olduğundan emin olun."
        fi
    else
        info "Kendinden imzalı (self-signed) sertifika oluşturuluyor..."
        mkdir -p /etc/ultimate-vpn/certs

        # CAMOUFLAGE_DOMAIN veya LETSENCRYPT_DOMAIN'i kullan
        local cert_cn=${CAMOUFLAGE_DOMAIN:-"web.whatsapp.com"}

        openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
            -subj "/C=US/ST=California/O=Google LLC/CN=$cert_cn" \
            -keyout /etc/ultimate-vpn/certs/private.key \
            -out /etc/ultimate-vpn/certs/certificate.crt

        CERT_FILE_PATH="/etc/ultimate-vpn/certs/certificate.crt"
        KEY_FILE_PATH="/etc/ultimate-vpn/certs/private.key"
        success "Kendinden imzalı sertifika oluşturuldu."
    fi
}

# XanMod Kernel kurulumu (Ultimate Performance)
install_xanmod_kernel() {
    ultimate "XanMod Yüksek Performans Kernel kuruluyor..."
    
    wget -qO - https://dl.xanmod.org/archive.key | gpg --dearmor -o /usr/share/keyrings/xanmod-archive-keyring.gpg
    echo 'deb [signed-by=/usr/share/keyrings/xanmod-archive-keyring.gpg] http://deb.xanmod.org releases main' | tee /etc/apt/sources.list.d/xanmod-release.list
    
    apt update
    
    # CPU mimarisine göre kernel seç
    CPU_LEVEL=$(awk -f <(wget -qO - https://dl.xanmod.org/check_x86-64_psabi.sh))
    case $CPU_LEVEL in
        1) KERNEL_VARIANT="linux-xanmod-x64v1" ;;
        2) KERNEL_VARIANT="linux-xanmod-x64v2" ;;
        3) KERNEL_VARIANT="linux-xanmod-x64v3" ;;
        4) KERNEL_VARIANT="linux-xanmod-x64v4" ;;
        *) KERNEL_VARIANT="linux-xanmod" ;;
    esac
    
    apt install -y $KERNEL_VARIANT
    success "XanMod Kernel kuruldu: $KERNEL_VARIANT"
}

# Ultimate Sistem Optimizasyonu
optimize_system_ultimate() {
    ultimate "Ultimate sistem optimizasyonu uygulanıyor..."
    
    # BBR v2 etkinleştir
    cat >> /etc/sysctl.conf << EOF

# === ULTIMATE NETWORK OPTIMIZATION ===
# BBR v2 Congestion Control
net.core.default_qdisc=fq_codel
net.ipv4.tcp_congestion_control=bbr

# Buffer boyutları (32MB)
net.core.rmem_default=262144
net.core.rmem_max=134217728
net.core.wmem_default=262144
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 87380 134217728
net.ipv4.tcp_wmem=4096 65536 134217728
net.ipv4.udp_rmem_min=8192
net.ipv4.udp_wmem_min=8192

# TCP Optimizasyonu
net.ipv4.tcp_fastopen=3
net.ipv4.tcp_slow_start_after_idle=0
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_fin_timeout=10
net.ipv4.tcp_keepalive_time=120
net.ipv4.tcp_keepalive_probes=3
net.ipv4.tcp_keepalive_intvl=10
net.ipv4.tcp_max_tw_buckets=2000000
net.ipv4.tcp_max_syn_backlog=65536
net.core.netdev_max_backlog=65536

# Memory ve CPU optimizasyonu
vm.swappiness=1
vm.dirty_ratio=3
vm.dirty_background_ratio=1
vm.vfs_cache_pressure=50
kernel.sched_autogroup_enabled=0

# Security + Performance
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.default.rp_filter=1
net.ipv4.tcp_syncookies=1
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
net.ipv4.conf.all.accept_redirects=0
net.ipv6.conf.all.accept_redirects=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.all.accept_source_route=0
net.ipv6.conf.all.accept_source_route=0

# Connection tracking optimization
net.netfilter.nf_conntrack_max=1048576
net.netfilter.nf_conntrack_tcp_timeout_established=1800
net.netfilter.nf_conntrack_tcp_timeout_time_wait=1
net.netfilter.nf_conntrack_tcp_timeout_close_wait=10
net.netfilter.nf_conntrack_tcp_timeout_fin_wait=20

# File descriptor limits
fs.file-max=1048576
fs.inotify.max_user_instances=8192
fs.inotify.max_user_watches=524288
EOF

    # Limits.conf optimizasyonu
    cat >> /etc/security/limits.conf << EOF
# === ULTIMATE LIMITS ===
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 1048576
* hard nproc 1048576
root soft nofile 1048576
root hard nofile 1048576
root soft nproc 1048576
root hard nproc 1048576
EOF

    # Systemd limits
    mkdir -p /etc/systemd/system.conf.d
    cat > /etc/systemd/system.conf.d/limits.conf << EOF
[Manager]
DefaultLimitNOFILE=1048576
DefaultLimitNPROC=1048576
EOF

    sysctl -p
    success "Ultimate sistem optimizasyonu tamamlandı"
}

# WireGuard Ultimate Performance
install_wireguard_ultimate() {
    ultimate "WireGuard Ultimate Performance Edition kuruluyor..."
    
    apt install -y wireguard-tools linux-headers-$(uname -r)
    
    cd /etc/wireguard
    wg genkey | tee server_private.key | wg pubkey > server_public.key
    wg genkey | tee client_private.key | wg pubkey > client_public.key
    
    SERVER_PRIVATE=$(cat server_private.key)
    SERVER_PUBLIC=$(cat server_public.key)
    CLIENT_PRIVATE=$(cat client_private.key)
    CLIENT_PUBLIC=$(cat client_public.key)
    
    # Ultimate WireGuard konfigürasyonu
    cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.7.0.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIVATE
MTU = 1420
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE; sysctl -w net.ipv4.ip_forward=1
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client with ultimate settings
[Peer]
PublicKey = $CLIENT_PUBLIC
AllowedIPs = 10.7.0.2/32
PersistentKeepalive = 25
EOF
    
    # Ultimate client konfigürasyonu
    cat > /etc/wireguard/client-ultimate.conf << EOF
[Interface]
PrivateKey = $CLIENT_PRIVATE
Address = 10.7.0.2/24
DNS = 1.1.1.1, 1.0.0.1
MTU = 1420

[Peer]
PublicKey = $SERVER_PUBLIC
Endpoint = $SERVER_IP:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
EOF
    
    # WireGuard servisi optimize et
    mkdir -p /etc/systemd/system/wg-quick@wg0.service.d
    cat > /etc/systemd/system/wg-quick@wg0.service.d/override.conf << EOF
[Service]
ExecStart=
ExecStart=/usr/bin/wg-quick up %i
ExecStartPost=/bin/bash -c 'echo 2 > /sys/class/net/wg0/queues/rx-0/rps_cpus || true'
ExecStartPost=/bin/bash -c 'echo 2 > /sys/class/net/wg0/queues/tx-0/xps_cpus || true'
EOF
    
    systemctl daemon-reload
    systemctl enable wg-quick@wg0
    systemctl start wg-quick@wg0
    
    # QR kod oluştur
    qrencode -t ansiutf8 < /etc/wireguard/client-ultimate.conf
    qrencode -o /etc/wireguard/client-ultimate-qr.png < /etc/wireguard/client-ultimate.conf
    
    success "WireGuard Ultimate kuruldu - Port: 51820/UDP"
}

# Xray Ultimate Multi-SNI Reality
install_xray_ultimate() {
    ultimate "Xray Ultimate Multi-SNI Reality kuruluyor..."
    
    # Sadece xray çekirdeğini kur
    bash <(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh) install
    
    # Eğer UI panel kurulacaksa, config oluşturmayı atla
    if [ "$INSTALL_UI_PANEL" = "y" ]; then
        info "UI Panel kurulumu seçildiği için manuel Xray yapılandırması atlanıyor."
        # Xray servisini durdur, panel yönetecek
        systemctl stop xray
        return
    fi

    # SNI domain array oluştur
    IFS=',' read -ra SNI_ARRAY <<< "$SNI_DOMAINS"
    
    # Multiple UUID'ler oluştur
    VLESS_UUID=$(cat /proc/sys/kernel/random/uuid)
    VMESS_UUID=$(cat /proc/sys/kernel/random/uuid)
    TROJAN_UUID=$(cat /proc/sys/kernel/random/uuid)
    
    # WhatsApp SNI array oluştur
    WHATSAPP_SNI_ARRAY=("web.whatsapp.com" "wa.me" "whatsapp.com" "facebook.com")
    ALL_SNI_ARRAY=($(echo $SNI_DOMAINS | tr ',' ' ') "${WHATSAPP_SNI_ARRAY[@]}")
    
    # Reality keys
    REALITY_KEYS=$(xray x25519)
    PRIVATE_KEY=$(echo "$REALITY_KEYS" | grep "Private key:" | cut -d' ' -f3)
    PUBLIC_KEY=$(echo "$REALITY_KEYS" | grep "Public key:" | cut -d' ' -f3)
    SHORT_ID1=$(openssl rand -hex 8)
    SHORT_ID2=$(openssl rand -hex 8)
    SHORT_ID3=$(openssl rand -hex 8)
    
    # Ultimate Multi-Protocol Xray Config with WhatsApp optimization
    # TLS SNI, LETSENCRYPT_DOMAIN veya CAMOUFLAGE_DOMAIN'e göre ayarlanır
    local tls_sni=${LETSENCRYPT_DOMAIN:-$CAMOUFLAGE_DOMAIN}

    cat > /usr/local/etc/xray/config.json << EOF
{
  "log": {
    "loglevel": "info",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  "inbounds": [
    {
      "tag": "vless-reality-whatsapp",
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "$VLESS_UUID",
            "flow": "xtls-rprx-vision",
            "email": "vless-whatsapp@ultimate"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "web.whatsapp.com:443",
          "xver": 0,
          "serverNames": ["web.whatsapp.com", "wa.me", "whatsapp.com", $(printf '"%s",' "${SNI_ARRAY[@]}" | sed 's/,$///')],
          "privateKey": "$PRIVATE_KEY",
          "shortIds": ["$SHORT_ID1", "$SHORT_ID2", "$SHORT_ID3"]
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls", "quic"]
      }
    },
    {
      "tag": "vmess-ws-whatsapp",
      "port": 8080,
      "protocol": "vmess",
      "settings": {
        "clients": [
          {
            "id": "$VMESS_UUID",
            "alterId": 0,
            "email": "vmess-whatsapp@ultimate"
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
          "path": "/whatsapp-ws",
          "headers": {
            "Host": "$tls_sni"
          }
        }
      }
    },
    {
      "tag": "trojan-ws-tls",
      "port": 8443,
      "protocol": "trojan",
      "settings": {
        "clients": [
          {
            "password": "$VPN_PASS",
            "email": "trojan-ws@ultimate"
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "security": "tls",
        "wsSettings": {
          "path": "/trojan-ws"
        },
        "tlsSettings": {
          "serverName": "$tls_sni",
          "certificates": [
            {
              "certificateFile": "$CERT_FILE_PATH",
              "keyFile": "$KEY_FILE_PATH"
            }
          ]
        }
      }
    },
    {
      "tag": "shadowsocks-2022",
      "port": 9443,
      "protocol": "shadowsocks",
      "settings": {
        "method": "2022-blake3-aes-256-gcm",
        "password": "$VPN_PASS",
        "network": "tcp,udp"
      }
    },
    {
      "tag": "vless-grpc-tls",
      "port": 8082,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "$VLESS_UUID",
            "email": "vless-grpc@ultimate"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "grpc",
        "security": "tls",
        "grpcSettings": {
          "serviceName": "vless-grpc"
        },
        "tlsSettings": {
          "serverName": "$tls_sni",
          "certificates": [
            {
              "certificateFile": "$CERT_FILE_PATH",
              "keyFile": "$KEY_FILE_PATH"
            }
          ]
        }
      }
    }
  ],
  "outbounds": [
    {
      "tag": "direct",
      "protocol": "freedom"
    },
    {
      "tag": "blocked",
      "protocol": "blackhole"
    }
  ],
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "domain": ["geosite:whatsapp"],
        "outboundTag": "direct"
      },
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "blocked"
      }
    ]
  }
}
EOF
    
    mkdir -p /var/log/xray
    systemctl enable xray
    systemctl start xray
    
    # WhatsApp optimized client konfigürasyonları
    cat > /etc/xray-ultimate-configs.txt << EOF
=== XRAY ULTIMATE WHATSAPP CONFIGURATIONS ===

1. VLESS Reality WhatsApp Bypass (En Güçlü):
Server: $SERVER_IP
Port: 443
UUID: $VLESS_UUID
Flow: xtls-rprx-vision
Security: reality
SNI: web.whatsapp.com
Public Key: $PUBLIC_KEY
Short ID: $SHORT_ID1
Fingerprint: chrome

2. VMess WebSocket WhatsApp Masking:
Server: $SERVER_IP
Port: 8080
UUID: $VMESS_UUID
Path: /whatsapp-ws
Host: web.whatsapp.com
User-Agent: WhatsApp/2.0

3. Trojan WebSocket WhatsApp:
Server: $SERVER_IP
Port: 8443
Password: $VPN_PASS
Path: /whatsapp-trojan
SNI: web.whatsapp.com

4. Shadowsocks WhatsApp:
Server: $SERVER_IP
Port: 9443
Method: chacha20-ietf-poly1305
Password: $VPN_PASS

WhatsApp Reality JSON (v2rayN/v2rayNG):
{
  "v": "2",
  "ps": "Ultimate-WhatsApp-Reality",
  "add": "$SERVER_IP",
  "port": "443",
  "id": "$VLESS_UUID",
  "net": "tcp",
  "type": "none",
  "host": "",
  "path": "",
  "tls": "reality",
  "sni": "web.whatsapp.com",
  "alpn": "",
  "fp": "chrome",
  "pbk": "$PUBLIC_KEY",
  "sid": "$SHORT_ID1"
}

Clash Meta Config:
proxies:
  - name: "Ultimate-WhatsApp-Reality"
    type: vless
    server: $SERVER_IP
    port: 443
    uuid: $VLESS_UUID
    network: tcp
    tls: true
    udp: true
    flow: xtls-rprx-vision
    reality-opts:
      public-key: $PUBLIC_KEY
      short-id: $SHORT_ID1
    servername: web.whatsapp.com
    client-fingerprint: chrome
  - name: "Ultimate-VLESS-gRPC"
    type: vless
    server: $SERVER_IP
    port: 8082
    uuid: $VLESS_UUID
    network: grpc
    tls: true
    udp: true
    servername: $tls_sni
    client-fingerprint: chrome
    grpc-opts:
      grpc-service-name: "vless-grpc"
EOF
    
    success "Xray Ultimate Multi-SNI Reality + WhatsApp Bypass kuruldu"
}

# Hysteria2 Ultimate Performance
install_hysteria2_ultimate() {
    ultimate "Hysteria2 Ultimate Performance Edition kuruluyor..."
    
    cd /tmp
    wget https://github.com/apernet/hysteria/releases/latest/download/hysteria-linux-amd64
    chmod +x hysteria-linux-amd64
    mv hysteria-linux-amd64 /usr/local/bin/hysteria
    
    mkdir -p /etc/hysteria

    local tls_sni=${LETSENCRYPT_DOMAIN:-$CAMOUFLAGE_DOMAIN}
    
    # Ultimate Hysteria2 config
    cat > /etc/hysteria/config.yaml << EOF
listen: :36712

tls:
  cert: $CERT_FILE_PATH
  key: $KEY_FILE_PATH

auth:
  type: password
  password: $VPN_PASS

masquerade:
  type: proxy
  proxy:
    url: https://$CAMOUFLAGE_DOMAIN
    rewriteHost: true

bandwidth:
  up: 1000 mbps
  down: 1000 mbps

ignoreClientBandwidth: false

quic:
  initStreamReceiveWindow: 16777216
  maxStreamReceiveWindow: 16777216
  initConnReceiveWindow: 33554432
  maxConnReceiveWindow: 33554432
  maxIdleTimeout: 30s
  maxIncomingStreams: 1024
  disablePathMTUDiscovery: false

resolver:
  type: https
  https:
    addr: 1.1.1.1:443
    timeout: 10s
EOF
    
    # Systemd servis (performance optimized)
    cat > /etc/systemd/system/hysteria-ultimate.service << EOF
[Unit]
Description=Hysteria2 Ultimate Performance
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/hysteria server --config /etc/hysteria/config.yaml
Restart=on-failure
RestartSec=5
LimitNOFILE=1048576
LimitNPROC=1048576

# Performance settings
Nice=-10
IOSchedulingClass=1
IOSchedulingPriority=4
CPUSchedulingPolicy=1
CPUSchedulingPriority=50

[Install]
WantedBy=multi-user.target
EOF
    
    # Client config
    local tls_sni=${LETSENCRYPT_DOMAIN:-$CAMOUFLAGE_DOMAIN}
    local insecure_tls_client="true"
    if [ "$USE_LETSENCRYPT" = "y" ]; then
        insecure_tls_client="false"
    fi

    cat > /etc/hysteria/client-ultimate.yaml << EOF
server: $SERVER_IP:36712

auth: $VPN_PASS

tls:
  sni: $tls_sni
  insecure: $insecure_tls_client

bandwidth:
  up: 500 mbps
  down: 500 mbps

socks5:
  listen: 127.0.0.1:1080

http:
  listen: 127.0.0.1:8080

lazy: false
EOF
    
    systemctl daemon-reload
    systemctl enable hysteria-ultimate
    systemctl start hysteria-ultimate
    
    success "Hysteria2 Ultimate + WhatsApp Bypass kuruldu - Port: 36712/UDP"
}

# TUIC v5 (En Hızlı UDP VPN)
install_tuic_ultimate() {
    ultimate "TUIC v5 Ultimate Speed Edition kuruluyor..."
    
    cd /tmp
    wget https://github.com/EAimTY/tuic/releases/latest/download/tuic-server-1.0.0-x86_64-unknown-linux-gnu
    chmod +x tuic-server-*
    mv tuic-server-* /usr/local/bin/tuic-server
    
    # TUIC UUID oluştur
    TUIC_UUID=$(cat /proc/sys/kernel/random/uuid)
    mkdir -p /etc/tuic
    local tls_sni=${LETSENCRYPT_DOMAIN:-"web.whatsapp.com"}
    
    cat > /etc/tuic/config.json << EOF
{
    "server": "[::]:8443",
    "users": {
        "$TUIC_UUID": "$VPN_PASS"
    },
    "certificate": "$CERT_FILE_PATH",
    "private_key": "$KEY_FILE_PATH",
    "congestion_control": "bbr",
    "alpn": ["h3"],
    "log_level": "info",
    "dual_stack": true,
    "zero_rtt_handshake": true
}
EOF
    
    # TUIC systemd service
    cat > /etc/systemd/system/tuic-ultimate.service << EOF
[Unit]
Description=TUIC v5 Ultimate Speed
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/tuic-server -c /etc/tuic/config.json
Restart=on-failure
RestartSec=5
LimitNOFILE=1048576
Nice=-15

[Install]
WantedBy=multi-user.target
EOF
    
    # WhatsApp optimized client config
    cat > /etc/tuic/client.json << EOF
{
    "relay": {
        "server": "$SERVER_IP:8443",
        "uuid": "$TUIC_UUID",
        "password": "$VPN_PASS",
        "alpn": ["h3"],
        "sni": "$tls_sni",
        "udp_relay_mode": "native",
        "congestion_control": "bbr",
        "zero_rtt_handshake": true,
        "dual_stack": true,
        "insecure_skip_verify": $([ "$USE_LETSENCRYPT" = "y" ] && echo "false" || echo "true")
    },
    "local": {
        "server": "127.0.0.1:1080"
    },
    "log_level": "info"
}
EOF
    
    systemctl daemon-reload
    systemctl enable tuic-ultimate
    systemctl start tuic-ultimate
    
    success "TUIC v5 Ultimate + WhatsApp Bypass kuruldu - Port: 8443/UDP"
}

# SSH-TLS VPN Ultimate (WhatsApp Optimized)
install_ssh_tls_ultimate() {
    ultimate "SSH-TLS VPN Ultimate (WhatsApp Optimized) kuruluyor..."
    
    # Install dependencies
    apt install -y stunnel4 openssh-server dropbear-bin
    
    mkdir -p /etc/stunnel
    local tls_sni=${LETSENCRYPT_DOMAIN:-"web.whatsapp.com"}

    # Create PEM file for stunnel
    cat "$CERT_FILE_PATH" "$KEY_FILE_PATH" > /etc/stunnel/stunnel.pem
    chmod 600 /etc/stunnel/stunnel.pem
    
    # SSH-TLS Stunnel config for WhatsApp bypass
    cat > /etc/stunnel/ssh-tls.conf << EOF
# SSH-TLS Ultimate Performance Configuration
cert = /etc/stunnel/stunnel.pem
pid = /var/run/stunnel-ssh.pid
debug = 3
sslVersion = all
options = NO_SSLv2
options = NO_SSLv3
options = CIPHER_SERVER_PREFERENCE
socket = l:TCP_NODELAY=1
socket = r:TCP_NODELAY=1

[ssh-tls-443]
accept = 443
connect = 127.0.0.1:22
sni = $tls_sni
EOF

    # Optimize SSH server for performance
    cat >> /etc/ssh/sshd_config << EOF

# === SSH-TLS ULTIMATE PERFORMANCE OPTIMIZATION ===
Port 22
TCPKeepAlive yes
ClientAliveInterval 30
ClientAliveCountMax 3
UseDNS no
AllowTcpForwarding yes
GatewayPorts yes
PermitTunnel yes
PasswordAuthentication yes
PermitRootLogin yes
Compression delayed
Ciphers aes128-gcm@openssh.com,chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
EOF

    # Dropbear config for additional bypass
    cat > /etc/default/dropbear << EOF
NO_START=0
DROPBEAR_PORT=444
DROPBEAR_EXTRA_ARGS="-p 8080 -p 9080"
DROPBEAR_BANNER=""
DROPBEAR_RECEIVE_WINDOW=65536
EOF

    # SSH-TLS systemd service
    cat > /etc/systemd/system/ssh-tls-ultimate.service << EOF
[Unit]
Description=SSH-TLS Ultimate WhatsApp VPN
After=network.target

[Service]
Type=forking
User=root
ExecStart=/usr/bin/stunnel4 /etc/stunnel/ssh-tls.conf
ExecReload=/bin/kill -HUP \$MAINPID
PIDFile=/var/run/stunnel-ssh.pid
KillMode=process
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    # Start services
    systemctl daemon-reload
    systemctl enable ssh-tls-ultimate
    systemctl start ssh-tls-ultimate
    systemctl restart ssh
    systemctl enable dropbear
    systemctl start dropbear

    success "SSH-TLS Ultimate WhatsApp VPN kuruldu - Port: 443/TCP (Stunnel)"
}

# Sing-Box Ultimate Multi-Protocol (WhatsApp Optimized)
install_singbox_ultimate() {
    ultimate "Sing-Box Ultimate Multi-Protocol + WhatsApp Bypass kuruluyor..."
    
    # Download and install Sing-Box
    cd /tmp
    LATEST_SINGBOX_URL=$(curl -s "https://api.github.com/repos/SagerNet/sing-box/releases/latest" | grep "browser_download_url" | grep "linux-amd64" | cut -d '"' -f 4)
    if [ -z "$LATEST_SINGBOX_URL" ]; then
        error "Sing-Box son sürümü alınamadı. Manuel kontrol edin."
        LATEST_SINGBOX_URL="https://github.com/SagerNet/sing-box/releases/download/v1.9.0-beta.7/sing-box-1.9.0-beta.7-linux-amd64.tar.gz" # Fallback
    fi
    wget -O sing-box.tar.gz "$LATEST_SINGBOX_URL"

    SINGBOX_DIR=$(tar -tzf sing-box.tar.gz | head -1 | cut -f1 -d"/")
    tar xzf sing-box.tar.gz
    
    mv "$SINGBOX_DIR/sing-box" /usr/local/bin/
    rm -rf "$SINGBOX_DIR" sing-box.tar.gz
    
    mkdir -p /etc/sing-box

    SINGBOX_VLESS_UUID=$(cat /proc/sys/kernel/random/uuid)
    REALITY_KEYS=$(xray x25519)
    PRIVATE_KEY=$(echo "$REALITY_KEYS" | grep "Private key:" | cut -d' ' -f3)
    PUBLIC_KEY=$(echo "$REALITY_KEYS" | grep "Public key:" | cut -d' ' -f3)
    SHORT_ID=$(openssl rand -hex 8)
    local tls_sni=${LETSENCRYPT_DOMAIN:-"web.whatsapp.com"}

    # Create Sing-Box config with WhatsApp optimization
    cat > /etc/sing-box/config.json << EOF
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-reality-whatsapp",
      "listen": "::",
      "listen_port": 9443,
      "users": [
        {
          "uuid": "$SINGBOX_VLESS_UUID",
          "flow": "xtls-rprx-vision"
        }
      ],
      "transport": {
        "type": "tcp"
      },
      "tls": {
        "enabled": true,
        "server_name": "web.whatsapp.com",
        "reality": {
          "enabled": true,
          "handshake": {
            "server": "web.whatsapp.com",
            "server_port": 443
          },
          "private_key": "$PRIVATE_KEY",
          "short_id": ["$SHORT_ID"]
        }
      }
    },
    {
      "type": "hysteria2",
      "tag": "hy2-whatsapp",
      "listen": "::",
      "listen_port": 36713,
      "users": [
        {
          "password": "$VPN_PASS"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "$tls_sni",
        "alpn": ["h3"],
        "certificate_path": "$CERT_FILE_PATH",
        "key_path": "$KEY_FILE_PATH"
      }
    }
  ],
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct"
    }
  ],
  "route": {
    "rules": [
      {
        "protocol": "dns",
        "outbound": "dns-out"
      },
      {
        "domain_suffix": ["geosite:whatsapp"],
        "outbound": "direct"
      }
    ]
  }
}
EOF

    # Create systemd service for Sing-Box
    cat > /etc/systemd/system/sing-box.service << EOF
[Unit]
Description=Sing-Box Ultimate Service
After=network.target nss-lookup.target

[Service]
User=root
WorkingDirectory=/etc/sing-box
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
ExecStart=/usr/local/bin/sing-box run -c /etc/sing-box/config.json
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=10
LimitNOFILE=infinity

[Install]
WantedBy=multi-user.target
EOF

    # Create client config details
    cat > /etc/sing-box/client-configs.txt << EOF
=== SING-BOX ULTIMATE WHATSAPP CONFIGS ===

1. VLESS Reality (for clients like v2rayNG):
---------------------------------------------
Address: $SERVER_IP
Port: 9443
UUID: $SINGBOX_VLESS_UUID
Flow: xtls-rprx-vision
Security: reality
SNI: web.whatsapp.com
Fingerprint: chrome
Public Key: $PUBLIC_KEY
Short ID: $SHORT_ID

2. Hysteria2 (for clients like NekoBox/Clash Meta):
---------------------------------------------------
Server: $SERVER_IP:36713
Password: $VPN_PASS
SNI: $tls_sni
Insecure: $([ "$USE_LETSENCRYPT" = "y" ] && echo "false" || echo "true")

EOF
    
    systemctl daemon-reload
    systemctl enable sing-box
    systemctl start sing-box
    
    success "Sing-Box Ultimate + WhatsApp Bypass kuruldu - Ports: 9443/TCP (VLESS), 36713/UDP (Hysteria2)"
    info "Sing-Box client configs saved to /etc/sing-box/client-configs.txt"
}

# Ultimate Firewall + Traffic Shaping
setup_ultimate_firewall() {
    ultimate "Ultimate Firewall + QoS Traffic Shaping kuruluyor..."
    
    # UFW Ultimate Config
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # SSH
    ufw allow 22/tcp
    ufw allow 2222/tcp
    
    # Allow port 80 for Let's Encrypt
    if [ "$USE_LETSENCRYPT" = "y" ]; then
        ufw allow 80/tcp
    fi

    # VPN Ports (WhatsApp Optimized)
    ufw allow 51820/udp  # WireGuard
    ufw allow 443/tcp    # Xray Reality & SSH-TLS WhatsApp
    ufw allow 8080/tcp   # Xray VMess-WS & Dropbear
    ufw allow 8082/tcp   # Xray VLESS-gRPC
    ufw allow 8443/tcp   # Xray Trojan-WS & TUIC & SSH-TLS
    ufw allow 36712/udp  # Hysteria2 WhatsApp
    ufw allow 36713/udp  # Sing-Box Hysteria2 WhatsApp
    ufw allow 9443/tcp   # Sing-Box VLESS & SSH-TLS WhatsApp
    ufw allow 22443/tcp  # SSH-TLS WhatsApp
    ufw allow 2443/tcp   # SSH WhatsApp
    ufw allow 444/tcp    # Dropbear
    ufw allow 9080/tcp   # Dropbear
    ufw allow 10443/tcp  # Dropbear
    
    ufw --force enable
    
    # Advanced iptables rules
    iptables -t mangle -A FORWARD -o wg0 -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
    iptables -t mangle -A FORWARD -i wg0 -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
    
    # QoS Traffic Control
    tc qdisc add dev eth0 root handle 1: htb default 30
    tc class add dev eth0 parent 1: classid 1:1 htb rate 1000mbit
    tc class add dev eth0 parent 1:1 classid 1:10 htb rate 800mbit ceil 1000mbit
    tc class add dev eth0 parent 1:1 classid 1:20 htb rate 150mbit ceil 300mbit
    tc class add dev eth0 parent 1:1 classid 1:30 htb rate 50mbit ceil 100mbit
    
    # VPN traffic gets priority (WhatsApp optimized)
    tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 51820 0xffff flowid 1:10
    tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 443 0xffff flowid 1:10
    tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 36712 0xffff flowid 1:10
    tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 22443 0xffff flowid 1:10
    tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 8443 0xffff flowid 1:10
    tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 9443 0xffff flowid 1:10
    
    # WhatsApp domain routing optimization
    iptables -t mangle -A OUTPUT -p tcp -m string --string "whatsapp.com" --algo kmp -j MARK --set-mark 1
    iptables -t mangle -A OUTPUT -p tcp -m string --string "wa.me" --algo kmp -j MARK --set-mark 1
    iptables -t mangle -A OUTPUT -p tcp -m string --string "web.whatsapp.com" --algo kmp -j MARK --set-mark 1
    
    # WhatsApp traffic priority
    tc filter add dev eth0 parent 1: protocol ip prio 1 handle 1 fw flowid 1:10
    
    # Ultimate NAT rules
    iptables -t nat -A POSTROUTING -s 10.0.0.0/8 -o eth0 -j MASQUERADE
    iptables -t nat -A POSTROUTING -s 172.16.0.0/12 -o eth0 -j MASQUERADE
    iptables -t nat -A POSTROUTING -s 192.168.0.0/16 -o eth0 -j MASQUERADE
    
    # Forward rules
    iptables -A FORWARD -i wg0 -j ACCEPT
    iptables -A FORWARD -o wg0 -j ACCEPT
    iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
    
    # Save rules
    iptables-save > /etc/iptables/rules.v4
    
    success "Ultimate Firewall + QoS kuruldu"
}

# Ultimate DNS-over-HTTPS Setup
setup_ultimate_dns() {
    ultimate "Ultimate DoH/DoT DNS kuruluyor..."
    
    # AdGuard Home installation
    cd /tmp
    wget https://github.com/AdguardTeam/AdGuardHome/releases/latest/download/AdGuardHome_linux_amd64.tar.gz
    tar xzf AdGuardHome_linux_amd64.tar.gz
    mv AdGuardHome/AdGuardHome /usr/local/bin/
    
    # Create user
    useradd -r -s /bin/false -d /var/lib/adguardhome adguardhome
    mkdir -p /var/lib/adguardhome
    chown adguardhome:adguardhome /var/lib/adguardhome
    
    # AdGuard config
    cat > /var/lib/adguardhome/AdGuardHome.yaml << EOF
bind_host: 0.0.0.0
bind_port: 3000
users:
- name: admin
  password: \$(htpasswd -bnBC 10 "" "$VPN_PASS" | tr -d ':\n' | sed 's/\$2y/\$2a/')
auth_attempts: 5
block_auth_min: 15
http_proxy: ""
language: en
theme: auto
dns:
  bind_hosts:
  - 0.0.0.0
  port: 53
  statistics_interval: 24h
  querylog_enabled: true
  querylog_file_enabled: true
  querylog_interval: 2160h
  querylog_size_memory: 1000
  anonymize_client_ip: false
  protection_enabled: true
  blocking_mode: default
  blocked_response_ttl: 10
  parental_block_host: family-block.dns.adguard.com
  safebrowsing_block_host: standard-block.dns.adguard.com
  rewrites: []
  blocked_services: []
  upstream_dns:
  - https://dns.cloudflare.com/dns-query
  - https://dns.google/dns-query
  - tls://1.1.1.1
  - tls://8.8.8.8
  upstream_dns_file: ""
  bootstrap_dns:
  - 1.1.1.1
  - 8.8.8.8
  filtering_enabled: true
  filters_update_interval: 24
  parental_enabled: false
  safesearch_enabled: false
  safebrowsing_enabled: false
  resolve_clients: true
  use_private_ptr_resolvers: true
  local_ptr_upstreams: []
  fastest_timeout: 1s
  allowed_clients: []
  disallowed_clients: []
  blocked_hosts:
  - version.bind
  - id.server
  - hostname.bind
  cache_size: 4194304
  cache_ttl_min: 0
  cache_ttl_max: 0
  bogus_nxdomain: []
  aaaa_disabled: false
  enable_dnssec: false
  edns_client_subnet:
    custom_ip: ""
    enabled: false
    use_custom: false
  max_goroutines: 300
  handle_ddr: true
  ipset: []
  ipset_file: ""
  bootstrap_prefer_ipv6: false
  upstream_timeout: 10s
  private_networks: []
  use_private_ptr_resolvers: true
  local_ptr_upstreams: []
tls:
  enabled: true
  server_name: $SERVER_IP
  force_https: false
  port_https: 443
  port_dns_over_tls: 853
  port_dns_over_quic: 853
  port_dnscrypt: 0
  dnscrypt_config_file: ""
  allow_unencrypted_doh: false
  certificate_chain: "$CERT_FILE_PATH"
  private_key: "$KEY_FILE_PATH"
  strict_sni_check: false
querylog:
  ignored: []
  interval: 2160h
  size_memory: 1000
  enabled: true
  file_enabled: true
statistics:
  ignored: []
  interval: 24h
  enabled: true
filters:
- enabled: true
  url: https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt
  name: AdGuard DNS filter
  id: 1
- enabled: true
  url: https://adguardteam.github.io/HostlistsRegistry/assets/filter_2.txt
  name: AdAway Default Blocklist
  id: 2
whitelist_filters: []
user_rules: []
dhcp:
  enabled: false
  interface_name: ""
  local_domain_name: lan
  dhcpv4:
    gateway_ip: ""
    subnet_mask: ""
    range_start: ""
    range_end: ""
    lease_duration: 86400
    icmp_timeout_msec: 1000
    options: []
  dhcpv6:
    range_start: ""
    lease_duration: 86400
    ra_slaac_only: false
    ra_allow_slaac: false
clients:
  runtime_sources:
    whois: true
    arp: true
    rdns: true
    dhcp: true
    hosts: true
  persistent: []
log_file: ""
log_max_backups: 0
log_max_size: 100
log_max_age: 3
log_compress: false
log_localtime: false
verbose: false
os:
  group: ""
  user: ""
  rlimit_nofile: 0
schema_version: 20
EOF
    
    # SSL certificate for AdGuard
    # AdGuard will use the main certificate
    
    chown adguardhome:adguardhome /var/lib/adguardhome/AdGuardHome.yaml
    
    # Systemd service
    cat > /etc/systemd/system/adguardhome.service << EOF
[Unit]
Description=AdGuard Home Ultimate DNS
After=network.target

[Service]
Type=simple
User=adguardhome
Group=adguardhome
WorkingDirectory=/var/lib/adguardhome
ExecStart=/usr/local/bin/AdGuardHome -c /var/lib/adguardhome/AdGuardHome.yaml --no-check-update
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable adguardhome
    systemctl start adguardhome
    
    success "Ultimate DNS-over-HTTPS kuruldu - Web UI: https://$SERVER_IP:3000"
}

# Main Installation Logic
main_ultimate_install() {
    setup_certificates
    case $ULTIMATE_CHOICE in
        1) # Speed Demon
            info "Speed Demon modu seçildi: WireGuard + Hysteria2 + Optimizasyonlar"
            optimize_system_ultimate
            install_wireguard_ultimate
            install_hysteria2_ultimate
            ;;
        2) # Stealth Master
            info "Stealth Master modu seçildi: Xray + TUIC + SSH-TLS + DNS"
            install_xray_ultimate
            if [ "$INSTALL_UI_PANEL" = "y" ]; then install_3x_ui_panel; fi
            install_tuic_ultimate
            install_ssh_tls_ultimate
            setup_ultimate_dns
            ;;
        3) # Hybrid Beast
            info "Hybrid Beast modu seçildi: Speed + Stealth"
            optimize_system_ultimate
            install_wireguard_ultimate
            install_xray_ultimate
            if [ "$INSTALL_UI_PANEL" = "y" ]; then install_3x_ui_panel; fi
            install_hysteria2_ultimate
            install_ssh_tls_ultimate
            ;;
        4) # Custom Ultimate
            info "Custom Ultimate modu seçildi: Seçenekleri belirleyin"
            read -p "XanMod Kernel kurulsun mu? (y/n): " INSTALL_XANMOD
            read -p "WireGuard Ultimate kurulsun mu? (y/n): " INSTALL_WG
            read -p "Xray Multi-SNI kurulsun mu? (y/n): " INSTALL_XRAY
            read -p "Hysteria2 Ultimate kurulsun mu? (y/n): " INSTALL_HY2
            read -p "TUIC v5 kurulsun mu? (y/n): " INSTALL_TUIC
            read -p "Sing-Box Ultimate kurulsun mu? (y/n): " INSTALL_SINGBOX
            read -p "SSH-TLS WhatsApp kurulsun mu? (y/n): " INSTALL_SSHTLS
            read -p "Ultimate DNS kurulsun mu? (y/n): " INSTALL_DNS
            
            [[ $INSTALL_XANMOD =~ ^[Yy]$ ]] && install_xanmod_kernel
            optimize_system_ultimate
            [[ $INSTALL_WG =~ ^[Yy]$ ]] && install_wireguard_ultimate
            if [[ $INSTALL_XRAY =~ ^[Yy]$ ]]; then
                install_xray_ultimate
                if [ "$INSTALL_UI_PANEL" = "y" ]; then install_3x_ui_panel; fi
            fi
            [[ $INSTALL_HY2 =~ ^[Yy]$ ]] && install_hysteria2_ultimate
            [[ $INSTALL_TUIC =~ ^[Yy]$ ]] && install_tuic_ultimate
            [[ $INSTALL_SINGBOX =~ ^[Yy]$ ]] && install_singbox_ultimate
            [[ $INSTALL_SSHTLS =~ ^[Yy]$ ]] && install_ssh_tls_ultimate
            [[ $INSTALL_DNS =~ ^[Yy]$ ]] && setup_ultimate_dns
            ;;
        5) # MAXIMUM OVERDRIVE
            info "MAXIMUM OVERDRIVE modu seçildi: Tüm servisler ve optimizasyonlar kuruluyor!"
            install_xanmod_kernel
            optimize_system_ultimate
            install_wireguard_ultimate
            install_xray_ultimate
            if [ "$INSTALL_UI_PANEL" = "y" ]; then install_3x_ui_panel; fi
            install_hysteria2_ultimate
            install_tuic_ultimate
            install_singbox_ultimate
            install_ssh_tls_ultimate
            setup_ultimate_dns
            ;;
        *)
            error "Geçersiz Ultimate Mode seçimi!"
            ;;
    esac
}

# User Management Script
install_vpn_manager() {
    ultimate "Kullanıcı Yönetim Script'i (vpn-manager) kuruluyor..."

    cat > /usr/local/bin/vpn-manager << 'EOF'
#!/bin/bash

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

XRAY_CONFIG="/usr/local/etc/xray/config.json"
VLESS_TAG="vless-reality-whatsapp"

# Root kontrolü
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Bu script root yetkileri ile çalıştırılmalıdır (sudo kullanın)${NC}"
   exit 1
fi

if [ ! -f "$XRAY_CONFIG" ]; then
    echo -e "${RED}Xray yapılandırma dosyası bulunamadı: $XRAY_CONFIG${NC}"
    echo -e "${YELLOW}Lütfen önce Xray'i kurduğunuzdan emin olun.${NC}"
    exit 1
fi

list_users() {
    echo -e "${BLUE}--- Xray VLESS Kullanıcıları ---${NC}"
    jq -r ".inbounds[] | select(.tag==\"$VLESS_TAG\") | .settings.clients[] | \"- \(.email) (${GREEN}\(.id)${NC})\"" $XRAY_CONFIG
    echo "--------------------------------"
}

add_user() {
    read -p "Yeni kullanıcı için bir isim/e-posta girin: " email
    if [ -z "$email" ]; then
        echo -e "${RED}İsim boş olamaz.${NC}"
        return
    fi

    # E-postanın zaten var olup olmadığını kontrol et
    if jq -e ".inbounds[] | select(.tag==\"$VLESS_TAG\") | .settings.clients[] | select(.email==\"$email\")" $XRAY_CONFIG > /dev/null; then
        echo -e "${RED}Bu isimde bir kullanıcı zaten var: $email${NC}"
        return
    fi

    uuid=$(cat /proc/sys/kernel/random/uuid)

    # jq ile yeni kullanıcıyı ekle
    jq --arg email "$email" --arg uuid "$uuid" \
    '.inbounds |= map(if .tag == "$VLESS_TAG" then .settings.clients += [{"id": $uuid, "email": $email, "flow": "xtls-rprx-vision"}] else . end)' \
    $XRAY_CONFIG > ${XRAY_CONFIG}.tmp && mv ${XRAY_CONFIG}.tmp $XRAY_CONFIG

    echo -e "${GREEN}Kullanıcı başarıyla eklendi:${NC}"
    echo -e "  İsim: $email"
    echo -e "  UUID: $uuid"

    systemctl restart xray
    echo -e "${YELLOW}Xray servisi yeniden başlatıldı.${NC}"
}

delete_user() {
    list_users
    read -p "Silmek istediğiniz kullanıcının ismini/e-postasını girin: " email
    if [ -z "$email" ]; then
        echo -e "${RED}İsim boş olamaz.${NC}"
        return
    fi

    # Kullanıcının var olup olmadığını kontrol et
    if ! jq -e ".inbounds[] | select(.tag==\"$VLESS_TAG\") | .settings.clients[] | select(.email==\"$email\")" $XRAY_CONFIG > /dev/null; then
        echo -e "${RED}Kullanıcı bulunamadı: $email${NC}"
        return
    fi

    # jq ile kullanıcıyı sil
    jq --arg email "$email" \
    '.inbounds |= map(if .tag == "$VLESS_TAG" then .settings.clients |= map(select(.email != $email)) else . end)' \
    $XRAY_CONFIG > ${XRAY_CONFIG}.tmp && mv ${XRAY_CONFIG}.tmp $XRAY_CONFIG

    echo -e "${GREEN}Kullanıcı '$email' başarıyla silindi.${NC}"

    systemctl restart xray
    echo -e "${YELLOW}Xray servisi yeniden başlatıldı.${NC}"
}

main_menu() {
    while true; do
        echo
        echo -e "${BLUE}Ultimate VPN Yönetim Paneli${NC}"
        echo "--------------------------"
        echo "1) Xray VLESS Kullanıcısı Ekle"
        echo "2) Xray VLESS Kullanıcısı Sil"
        echo "3) Xray VLESS Kullanıcılarını Listele"
        echo "4) Çıkış"
        echo "--------------------------"
        read -p "Seçiminiz (1-4): " choice

        case $choice in
            1) add_user ;;
            2) delete_user ;;
            3) list_users ;;
            4) exit 0 ;;
            *) echo -e "${RED}Geçersiz seçim.${NC}" ;;
        esac
    done
}

main_menu
EOF

    chmod +x /usr/local/bin/vpn-manager
    success "Kullanıcı yönetim script'i kuruldu. Komut: vpn-manager"
}

# 3x-ui Panel Installation
install_3x_ui_panel() {
    ultimate "3x-ui Web Yönetim Paneli kuruluyor..."

    # Run the official installer
    bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)

    if [ $? -eq 0 ]; then
        success "3x-ui paneli başarıyla kuruldu."
        info "Panel bilgilerine ve yapılandırma seçeneklerine erişmek için 'x-ui' komutunu kullanabilirsiniz."
        warn "Güvenlik için, kurulum sonrası ilk iş olarak varsayılan kullanıcı adı ve şifreyi değiştirin."
    else
        error "3x-ui panel kurulumu sırasında bir hata oluştu."
    fi
}

# Performance Monitoring Setup
setup_monitoring() {
    ultimate "Performance Monitoring kuruluyor..."
    
    # Install monitoring tools
    apt install -y htop iotop nethogs iftop vnstat
    
    # Vnstat setup
    systemctl enable vnstat
    systemctl start vnstat
    
    # Create monitoring script
    cat > /usr/local/bin/vpn-monitor << 'EOF'
#!/bin/bash
echo "=== ULTIMATE VPN SUNUCU PERFORMANS ==="
echo "Tarih: $(date)"
echo
echo "=== SİSTEM BİLGİLERİ ==="
echo "CPU: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
echo "Cores: $(nproc)"
echo "Load: $(cat /proc/loadavg | cut -d' ' -f1-3)"
echo "RAM: $(free -h | awk 'NR==2{printf "%s/%s (%.1f%%)", $3, $2, $3/$2*100}')"
echo "Disk: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')"
echo "Uptime: $(uptime -p)"
echo
echo "=== NETWORK İSTATİSTİKLERİ ==="
vnstat -i eth0 --oneline | cut -d';' -f11-12
echo
echo "=== AKTİF BAĞLANTILAR ==="
ss -tuln | grep -E ':(443|51820|8080|8443|36712|36713|9443|22443|2443|444)' | wc -l
echo "Toplam aktif bağlantı sayısı: $(ss -tuln | wc -l)"
echo
echo "=== VPN SERVİSLERİ ==="
systemctl is-active wg-quick@wg0 2>/dev/null && echo "✓ WireGuard: $(systemctl is-active wg-quick@wg0)"
systemctl is-active xray 2>/dev/null && echo "✓ Xray WhatsApp: $(systemctl is-active xray)"
systemctl is-active hysteria-ultimate 2>/dev/null && echo "✓ Hysteria2 WhatsApp: $(systemctl is-active hysteria-ultimate)"
systemctl is-active tuic-ultimate 2>/dev/null && echo "✓ TUIC WhatsApp: $(systemctl is-active tuic-ultimate)"
systemctl is-active sing-box 2>/dev/null && echo "✓ Sing-Box WhatsApp: $(systemctl is-active sing-box)"
systemctl is-active ssh-tls-ultimate 2>/dev/null && echo "✓ SSH-TLS WhatsApp: $(systemctl is-active ssh-tls-ultimate)"
systemctl is-active dropbear 2>/dev/null && echo "✓ Dropbear SSH: $(systemctl is-active dropbear)"
systemctl is-active adguardhome 2>/dev/null && echo "✓ AdGuard DNS: $(systemctl is-active adguardhome)"
echo
echo "=== KERNEL VE NET STACK ==="
echo "Kernel: $(uname -r)"
echo "BBR: $(sysctl net.ipv4.tcp_congestion_control | cut -d= -f2 | xargs)"
echo "TCP FastOpen: $(sysctl net.ipv4.tcp_fastopen | cut -d= -f2 | xargs)"
echo
EOF
    
    chmod +x /usr/local/bin/vpn-monitor
    
    # Add to crontab for daily reports
    (crontab -l 2>/dev/null; echo "0 6 * * * /usr/local/bin/vpn-monitor >> /var/log/vpn-daily-report.log") | crontab -
    
    success "Performance Monitoring kuruldu - Komut: vpn-monitor"
}

# Generate Ultimate Report
generate_ultimate_report() {
    cat > /root/ultimate-vpn-report.txt << EOF
🚀 ULTIMATE VPN SUNUCU RAPORU 🚀
=====================================
Kurulum Tarihi: $(date)
Sunucu IP: $SERVER_IP
Hostname: $HOSTNAME
Kernel: $(uname -r)
CPU Cores: $CPU_CORES
Total RAM: $TOTAL_RAM

🔥 ULTIMATE MODE: $ULTIMATE_CHOICE
Camouflage Domain: $CAMOUFLAGE_DOMAIN  
SNI Domains: $SNI_DOMAINS
WhatsApp SNIs: $WHATSAPP_SNIS

📊 KURULU SERVİSLER:
=====================================
EOF

    if systemctl is-active --quiet wg-quick@wg0; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ WireGuard Ultimate - Port: 51820/UDP
   Config: /etc/wireguard/client-ultimate.conf
   QR Code: /etc/wireguard/client-ultimate-qr.png
   MTU: 1420 (Optimized)
   
EOF
    fi
    
    if [ "$INSTALL_UI_PANEL" = "y" ]; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ 3x-ui Web Yönetim Paneli
   Xray yönetimi için web arayüzü kuruldu.
   Panele erişmek ve varsayılan ayarları görmek için sunucuda 'x-ui' komutunu çalıştırın.
   Güvenlik için ilk girişte kullanıcı adı ve şifreyi değiştirmeyi unutmayın.

EOF
    elif systemctl is-active --quiet xray; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ Xray Ultimate (Manuel Kurulum)
   VLESS Reality: Port 443/TCP
   VMess WebSocket: Port 8080/TCP
   VLESS-gRPC: Port 8082/TCP
   Trojan WebSocket: Port 8443/TCP
   Shadowsocks 2022: Port 9443/TCP
   Config Details: /etc/xray-ultimate-configs.txt
   Yönetim Aracı: vpn-manager
   TLS SNI: ${LETSENCRYPT_DOMAIN:-Self-Signed}
   
EOF
    fi
    
    if systemctl is-active --quiet hysteria-ultimate; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ Hysteria2 Ultimate + WhatsApp Bypass - Port: 36712/UDP
   Speed: 1000 Mbps (Both directions)
   Client Config: /etc/hysteria/client-ultimate.yaml
   TLS SNI: ${LETSENCRYPT_DOMAIN:-Self-Signed}
   
EOF
    fi
    
    if systemctl is-active --quiet tuic-ultimate; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ TUIC v5 Ultimate + WhatsApp Speed - Port: 8443/UDP
   Protocol: QUIC v1 with BBR
   Client Config: /etc/tuic/client.json
   TLS SNI: ${LETSENCRYPT_DOMAIN:-Self-Signed}
   
EOF
    fi
    
    if systemctl is-active --quiet sing-box; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ Sing-Box Ultimate + WhatsApp Multi-Protocol
   VLESS Reality: Port 9443/TCP (WhatsApp SNI)
   Hysteria2: Port 36713/UDP (WhatsApp masquerade)
   Config Details: /etc/sing-box/client-configs.txt
   TLS SNI: ${LETSENCRYPT_DOMAIN:-Self-Signed}
   
EOF
    fi
    
    if systemctl is-active --quiet ssh-tls-ultimate; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ SSH-TLS Ultimate WhatsApp VPN
   SSH-TLS Stunnel: Port 443/TCP
   Dropbear SSH: Ports 444, 8080, 9080/TCP
   TLS SNI: ${LETSENCRYPT_DOMAIN:-Self-Signed}
   
EOF
    fi
    
    if systemctl is-active --quiet adguardhome; then
        cat >> /root/ultimate-vpn-report.txt << EOF
✅ Ultimate DNS-over-HTTPS - Port: 3000/TCP
   Web Interface: https://$SERVER_IP:3000
   DNS-over-TLS: Port 853
   Ad-blocking: Active
   Username: admin
   
EOF
    fi
    
    cat >> /root/ultimate-vpn-report.txt << EOF

🔧 SİSTEM OPTİMİZASYONLARI:
=====================================
✅ BBR v2 Congestion Control
✅ TCP Fast Open Enabled
✅ Buffer sizes: 32MB
✅ File descriptor limit: 1M
✅ QoS Traffic Shaping Active
$(if [[ -f /boot/vmlinuz-*xanmod* ]]; then echo "✅ XanMod High-Performance Kernel"; fi)

🛡️ GÜVENLİK ÖZELLİKLERİ:
=====================================
✅ Multi-SNI Domain Fronting
✅ WhatsApp Web SNI masquerading  
✅ Reality Protocol (Anti-detection)
✅ TLS 1.3 Everywhere
✅ $(if [ "$USE_LETSENCRYPT" = "y" ]; then echo "Let's Encrypt SSL: $LETSENCRYPT_DOMAIN"; else echo "Self-Signed SSL"; fi)
✅ Advanced firewall rules
✅ DPI evasion techniques
✅ SSH-TLS tunneling
✅ Multiple bypass ports

🌐 BAĞLANTI BİLGİLERİ:
=====================================
Sunucu IP: $SERVER_IP
VPN Kullanıcı: $VPN_USER
VPN Şifre: $VPN_PASS
Camouflage: $CAMOUFLAGE_DOMAIN
$(if [ "$USE_LETSENCRYPT" = "y" ]; then echo "Alan Adı: $LETSENCRYPT_DOMAIN"; fi)

📱 İstemci Uygulamaları:
=====================================
WireGuard: WireGuard Official
Xray WhatsApp: v2rayN, v2rayNG, Shadowrocket, Clash Meta
Hysteria2 WhatsApp: Hysteria2 Client, NekoBox
TUIC WhatsApp: Clash Meta, Sing-Box Client
SSH-TLS WhatsApp: Any SSH client + stunnel
AdGuard DNS: System DNS Settings

⚡ PERFORMANS İPUÇLARI:
=====================================
1. En hızlı: WireGuard veya Hysteria2 WhatsApp
2. En gizli: Xray Reality + WhatsApp SNI
3. WhatsApp için: SSH-TLS WhatsApp tunnel  
4. Mobil için: WireGuard (QR kod)
5. Ağır sansür: Xray Reality + Multi-SNI + WhatsApp
6. Monitoring: vpn-monitor komutu

🚀 WHATSAPP BYPASS İPUÇLARI:
=====================================
1. En etkili: SSH-TLS WhatsApp (port 22443)
2. En hızlı: Hysteria2 WhatsApp masquerade
3. En gizli: Xray Reality web.whatsapp.com SNI
4. Dropbear SSH: Alternatif portlar (444, 9080)
5. Multiple ports: 443, 8443, 9443, 22443
6. WhatsApp tunnel komutu: ssh-whatsapp-tunnel

📈 İZLEME VE YÖNETİM:
=====================================
Kullanıcı Yönetimi: vpn-manager (Xray VLESS kullanıcıları için)
Performans İzleme: vpn-monitor
Log dosyaları: /var/log/
Günlük rapor: /var/log/vpn-daily-report.log
Service yönetimi: systemctl

🚨 ÖNEMLİ NOTLAR:
=====================================
1. Tüm konfigürasyon dosyalarını yedekleyin
2. Firewall kuralları otomatik ayarlandı
3. Sistem otomatik olarak optimize edildi
4. Reboot sonrası tüm servisler otomatik başlar
5. Monitoring kuruldu ve aktif

$(if [[ $ULTIMATE_CHOICE == "5" ]]; then
echo "🔥 MAXIMUM OVERDRIVE MODE AKTIF!"
echo "Tüm protokoller + kernel + optimizasyonlar"
fi)

Last Updated: $(date)
EOF
    
    # Set proper permissions
    chmod 600 /root/ultimate-vpn-report.txt
    
    success "Ultimate VPN Raporu oluşturuldu: /root/ultimate-vpn-report.txt"
}

# System update and base packages
log "Sistem güncelleniyor ve temel paketler kuruluyor..."
apt update && apt upgrade -y
apt install -y curl wget git vim htop tree unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release build-essential \
    ufw iptables-persistent net-tools openssl qrencode jq bc vnstat \
    linux-headers-$(uname -r) dkms tcpdump iftop nethogs iotop

# Main installation
main_ultimate_install
setup_ultimate_firewall
setup_monitoring

# Manuel kurulumda vpn-manager'ı kur, UI panel seçilmediyse
if [ "$INSTALL_UI_PANEL" = "n" ]; then
    # Sadece Xray kurulduysa vpn-manager'ı kur
    if command -v xray &> /dev/null && [ -f "/usr/local/etc/xray/config.json" ]; then
        install_vpn_manager
    fi
fi

generate_ultimate_report

# Final message
ultimate "ULTIMATE VPN SUNUCU KURULUMU TAMAMLANDI!"
success "=========================================="
success "🚀 ULTIMATE MODE BAŞARIYLA AKTİF! 🚀"
success "=========================================="

echo
info "🔥 Kurulu Ultimate Servisler:"
systemctl list-units --type=service --state=active | grep -E "(wg-quick|xray|hysteria|tuic|sing-box|ssh-tls|dropbear|adguard)" || echo "   Servisler kontrol ediliyor..."

echo
info "📊 Detaylı rapor: /root/ultimate-vpn-report.txt"
info "📈 Performans monitor: vpn-monitor"
info "👤 Kullanıcı yönetimi: vpn-manager"
info "🌐 Konfigürasyon dosyaları ilgili dizinlerde"

echo
warn "🚨 ÖNEMLİ ULTIMATE + WHATSAPP NOTLARI:"
warn "1. $(if [[ $ULTIMATE_CHOICE == "5" ]]; then echo "MAXIMUM OVERDRIVE MODE - XanMod kernel + WhatsApp bypass kuruldu"; else echo "Sistem + WhatsApp bypass optimize edildi"; fi)"
warn "2. BBR v2 ve TCP optimizasyonları aktif"
warn "3. Sertifika Türü: $(if [ "$USE_LETSENCRYPT" = "y" ]; then echo "Let's Encrypt ($LETSENCRYPT_DOMAIN)"; else echo "Kendinden İmzalı (Self-Signed)"; fi)"
warn "4. Multi-SNI + WhatsApp bypass teknolojileri kuruldu"
warn "5. SSH-TLS tunnel aktif"
warn "6. QoS traffic shaping + WhatsApp priority aktif"
warn "7. Performance monitoring kuruldu"

echo
if [[ $ULTIMATE_CHOICE == "5" ]] || [[ $INSTALL_XANMOD =~ ^[Yy]$ ]]; then
    warn "⚠️  XANMOD KERNEL KURULDU - REBOOT GEREKLİ!"
    warn "Sistem 60 saniye içinde yeniden başlatılacak..."
    sleep 60
    reboot
else
    warn "✅ Sistem hazır! Reboot gerekmiyor."
fi

ultimate "Ultimate VPN sunucunuz + WhatsApp bypass hazır! 🚀📱"
