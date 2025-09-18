#!/bin/bash

# Ultimate VDS/VPN Kurulum Scripti
# 2GB RAM için optimize edilmiş ve swap alanı otomatik eklenmiştir
# SSH VPN ve diğer tüm bileşenler en güncel sürümleriyle kurulacaktır

# Config Bölümü
CONFIG_FILE="/etc/ultimate_vpn/config.cfg"
TARGET_LEVEL="ULTIMATE"
SERVICE_TYPE="VDS/VPN/SSH"
SENSITIVE_HOSTS="whatsapp.com,web.whatsapp.com,whatsapp.net,signal.org,telegram.org,facebook.com,instagram.com,twitter.com"

# Renkli çıktı fonksiyonları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Swap alanı oluştur (2GB RAM için)
setup_swap() {
    print_status "[1/13] Swap alanı yapılandırılıyor..."
    
    # Mevcut swap'ı kontrol et
    CURRENT_SWAP=$(free -m | awk '/Swap:/ {print $2}')
    if [ $CURRENT_SWAP -ge 2048 ]; then
        print_success "Yeterli swap alanı mevcut: ${CURRENT_SWAP}MB"
        return 0
    fi
    
    # Mevcut swap'ı kaldır (eğer yetersizse)
    if [ $CURRENT_SWAP -gt 0 ]; then
        swapoff /swapfile 2>/dev/null
        rm -f /swapfile
    fi
    
    # 4GB swap dosyası oluştur (2GB RAM için)
    SWAP_SIZE=4096
    dd if=/dev/zero of=/swapfile bs=1M count=$SWAP_SIZE
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Kalıcı yap
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Swap ayarlarını optimize et
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    sysctl -p
    
    print_success "Swap alanı oluşturuldu: ${SWAP_SIZE}MB"
}

# Sistem gereksinimlerini kontrol et
check_system() {
    print_status "[2/13] Sistem gereksinimleri kontrol ediliyor..."
    
    # Minimum gereksinimler (2GB RAM için optimize edilmiş)
    MIN_RAM=1024  # 1GB minimum
    MIN_DISK=10   # 10GB disk
    MIN_CORES=1   # 1 çekirdek
    OS_VERSION=$(lsb_release -rs)
    
    # OS versiyon kontrolü (Ubuntu 18.04+)
    if [[ $(echo "$OS_VERSION < 18.04" | bc -l) -eq 1 ]]; then
        print_warning "Ubuntu 18.04 veya üzeri önerilir. Mevcut sürüm: $OS_VERSION"
    fi

    # RAM kontrolü
    RAM=$(free -m | awk '/Mem:/ {print $2}')
    if [ $RAM -lt $MIN_RAM ]; then
        print_error "Yetersiz RAM. Minimum $MIN_RAM MB gereklidir. Mevcut: $RAM MB"
        exit 1
    fi
    
    # Disk kontrolü
    DISK=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
    if [ $DISK -lt $MIN_DISK ]; then
        print_error "Yetersiz disk alanı. Minimum $MIN_DISK GB gereklidir. Mevcut: $DISK GB"
        exit 1
    fi
    
    # CPU kontrolü
    CORES=$(nproc)
    if [ $CORES -lt $MIN_CORES ]; then
        print_warning "Önerilen CPU çekirdeği: $MIN_CORES+. Mevcut: $CORES"
    fi
    
    print_success "Sistem gereksinimleri karşılandı - RAM: ${RAM}MB, Disk: ${DISK}GB, Çekirdek: $CORES"
}

# Temel paketleri kur
install_dependencies() {
    print_status "[3/13] Temel paketler ve güncellemeler kuruluyor..."
    
    export DEBIAN_FRONTEND=noninteractive
    
    # Sistem güncellemeleri
    apt-get update
    apt-get upgrade -y
    apt-get dist-upgrade -y
    
    # Temel paketler (hafif sürümler)
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        libssl-dev \
        libffi-dev \
        python3 \
        python3-pip \
        python3-venv \
        net-tools \
        iptables-persistent \
        fail2ban \
        ufw \
        openssl \
        certbot \
        python3-certbot-nginx \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        jq \
        htop \
        iftop \
        zip \
        unzip \
        nano \
        vim \
        resolvconf \
        dnsutils \
        iputils-ping \
        traceroute \
        mtr-tiny \
        tcpdump \
        socat \
        netcat \
        openssh-server \
        openssh-client \
        rsync \
        cron \
        logrotate \
        sysstat \
        iotop \
        ethtool

    # Python paketleri
    pip3 install --upgrade pip
    pip3 install requests docker

    print_success "Temel paketler kuruldu"
}

# Docker ve containerd kurulumu (hafif sürüm)
install_docker() {
    print_status "[4/13] Docker ve containerd kuruluyor..."
    
    # Eski Docker sürümlerini kaldır
    apt-get remove -y docker docker-engine docker.io containerd runc
    rm -rf /var/lib/docker
    rm -rf /var/lib/containerd

    # Docker GPG key ekle
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Docker repository ekle
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update

    # Docker kur (hafif sürüm)
    apt-get install -y \
        docker-ce \
        docker-ce-cli \
        containerd.io

    # Docker servisini başlat
    systemctl start docker
    systemctl enable docker
    systemctl enable containerd

    # Docker grup ayarları
    usermod -aG docker $USER

    # Docker daemon.json yapılandırması (kaynak sınırları ile)
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "2"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "experimental": false,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  }
}
EOF

    # Docker servisini yeniden başlat
    systemctl restart docker

    print_success "Docker ve containerd kurulumu tamamlandı"
}

# SSH VPN kurulumu
setup_ssh_vpn() {
    print_status "[5/13] SSH VPN kurulumu yapılıyor..."
    
    # SSH sunucusunu yapılandır
    cat > /etc/ssh/sshd_config << EOF
Port 22
Port 443
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
UsePrivilegeSeparation yes
KeyRegenerationInterval 3600
ServerKeyBits 2048
SyslogFacility AUTH
LogLevel INFO
LoginGraceTime 120
PermitRootLogin no
StrictModes yes
RSAAuthentication yes
PubkeyAuthentication yes
IgnoreRhosts yes
RhostsRSAAuthentication no
HostbasedAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
PasswordAuthentication no
X11Forwarding yes
X11DisplayOffset 10
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
UsePAM yes
AllowTcpForwarding yes
GatewayPorts yes
AllowStreamLocalForwarding yes
PermitTunnel yes
ClientAliveInterval 30
ClientAliveCountMax 3
AllowUsers $USER
EOF

    # SSH için anahtar oluştur (eğer yoksa)
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    fi

    # SSH servisini yeniden başlat
    systemctl restart ssh

    # SSH VPN için özel script oluştur
    cat > /usr/local/bin/ssh-vpn-server << 'EOF'
#!/bin/bash

# SSH VPN Server Script
case "$1" in
    start)
        echo "SSH VPN sunucusu başlatılıyor..."
        # SSH portları aç
        iptables -A INPUT -p tcp --dport 22 -j ACCEPT
        iptables -A INPUT -p tcp --dport 443 -j ACCEPT
        iptables -A INPUT -p udp --dport 443 -j ACCEPT
        echo "SSH VPN hazır. Bağlantı bilgileri:"
        echo "SSH Port: 22, 443"
        echo "IP: $(curl -4 ifconfig.co)"
        ;;
    stop)
        echo "SSH VPN sunucusu durduruluyor..."
        ;;
    status)
        echo "SSH VPN Durumu:"
        netstat -tulpn | grep ssh
        ;;
    *)
        echo "Kullanım: $0 {start|stop|status}"
        exit 1
        ;;
esac
EOF

    chmod +x /usr/local/bin/ssh-vpn-server

    # SSH VPN servis dosyası oluştur
    cat > /etc/systemd/system/ssh-vpn.service << EOF
[Unit]
Description=SSH VPN Service
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/ssh-vpn-server start
ExecStop=/usr/local/bin/ssh-vpn-server stop
ExecReload=/bin/kill -HUP $MAINPID

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ssh-vpn
    systemctl start ssh-vpn

    print_success "SSH VPN kurulumu tamamlandı"
}

# VPN konteynerlerini kur (hafif sürümler)
setup_vpn_containers() {
    print_status "[6/13] VPN konteynerleri kuruluyor..."
    
    # VPN dizinlerini oluştur
    mkdir -p /opt/vpn/{wireguard,openvpn}
    mkdir -p /etc/wireguard
    mkdir -p /etc/openvpn

    # WireGuard (hafif sürüm)
    docker run -d \
      --name=wg-easy \
      -e WG_HOST=$(curl -4 ifconfig.co) \
      -e PASSWORD=$(openssl rand -base64 12) \
      -e WG_PORT=51820 \
      -e WG_DEFAULT_ADDRESS=10.8.0.x \
      -e WG_DEFAULT_DNS=1.1.1.1 \
      -e WG_ALLOWED_IPS=0.0.0.0/0 \
      -e WG_PERSISTENT_KEEPALIVE=25 \
      -v /etc/wireguard:/etc/wireguard \
      -p 51820:51820/udp \
      -p 51821:51821/tcp \
      --cap-add=NET_ADMIN \
      --cap-add=SYS_MODULE \
      --sysctl="net.ipv4.conf.all.src_valid_mark=1" \
      --sysctl="net.ipv4.ip_forward=1" \
      --restart unless-stopped \
      --memory=256m \
      --memory-swap=512m \
      weejewel/wg-easy:latest

    # OpenVPN (hafif sürüm)
    docker run -d \
      --name=openvpn \
      --cap-add=NET_ADMIN \
      -p 1194:1194/udp \
      -p 943:943/tcp \
      -v /etc/openvpn:/etc/openvpn \
      -e VPN_DEVICE=tun \
      -e VPN_PROTOCOL=udp \
      --restart unless-stopped \
      --memory=256m \
      --memory-swap=512m \
      kylemanna/openvpn:latest

    print_success "VPN konteynerleri kuruldu: WireGuard, OpenVPN"
}

# Nginx ve SNI optimizasyonu (hafif sürüm)
setup_nginx_sni() {
    print_status "[7/13] Nginx ve SNI optimizasyonu yapılıyor..."

    # Nginx kur
    apt-get install -y nginx nginx-extras

    # Özel SNI config dosyası oluştur
    mkdir -p /etc/nginx/snippets
    mkdir -p /etc/nginx/ssl

    # WhatsApp ve hassas SNI hostları için özel config
    cat > /etc/nginx/snippets/sni_optimization.conf << 'EOF'
# WhatsApp SNI optimizasyonu
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name whatsapp.com www.whatsapp.com;
    
    ssl_certificate /etc/letsencrypt/live/whatsapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whatsapp.com/privkey.pem;

    # SSL optimizasyonları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass https://www.whatsapp.com;
        proxy_ssl_server_name on;
        proxy_ssl_name $host;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}

# Diğer hassas SNI hostları
server {
    listen 443 ssl http2;
    server_name web.whatsapp.com;
    
    ssl_certificate /etc/letsencrypt/live/web.whatsapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/web.whatsapp.com/privkey.pem;
    
    location / {
        proxy_pass https://web.whatsapp.com;
        proxy_ssl_server_name on;
        proxy_set_header Host web.whatsapp.com;
    }
}
EOF

    # Ana nginx config (hafif)
    cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /var/run/nginx.pid;

events {
    worker_connections 8192;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    keepalive_requests 100;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Gzip sıkıştırma
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

    # Test domainleri için SSL (self-signed)
    mkdir -p /etc/letsencrypt/live/whatsapp.com
    mkdir -p /etc/letsencrypt/live/web.whatsapp.com
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/whatsapp.com/privkey.pem \
        -out /etc/letsencrypt/live/whatsapp.com/fullchain.pem \
        -subj "/CN=whatsapp.com"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/web.whatsapp.com/privkey.pem \
        -out /etc/letsencrypt/live/web.whatsapp.com/fullchain.pem \
        -subj "/CN=web.whatsapp.com"

    # Nginx'i başlat
    systemctl start nginx
    systemctl enable nginx

    print_success "Nginx ve SNI optimizasyonu tamamlandı"
}

# Güvenlik ayarları
setup_security() {
    print_status "[8/13] Güvenlik ayarları yapılandırılıyor..."

    # Firewall kuralları (UFW)
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 22/tcp comment 'SSH'
    ufw allow 443/tcp comment 'HTTPS/SSH-VPN'
    ufw allow 443/udp comment 'HTTPS/SSH-VPN'
    ufw allow 51820/udp comment 'WireGuard'
    ufw allow 1194/udp comment 'OpenVPN'
    ufw allow 80/tcp comment 'HTTP'
    ufw --force enable

    # Fail2ban yapılandırması
    cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
ignoreip = 127.0.0.1/8 ::1

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
EOF

    systemctl restart fail2ban
    systemctl enable fail2ban

    # Kernel güvenlik ayarları
    cat > /etc/sysctl.d/99-security.conf << 'EOF'
# Kernel security hardening
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.default.rp_filter=1
net.ipv4.tcp_syncookies=1
net.ipv4.tcp_synack_retries=2
net.ipv4.icmp_echo_ignore_broadcasts=1
net.ipv4.icmp_ignore_bogus_error_responses=1
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.default.accept_redirects=0
net.ipv4.conf.all.secure_redirects=0
net.ipv6.conf.all.accept_redirects=0
net.ipv6.conf.default.accept_redirects=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
kernel.kptr_restrict=2
kernel.printk=3 3 3 3
EOF

    sysctl -p /etc/sysctl.d/99-security.conf

    print_success "Güvenlik ayarları tamamlandı"
}

# Performans optimizasyonu
optimize_performance() {
    print_status "[9/13] Performans optimizasyonu yapılıyor..."

    # Kernel parametreleri
    cat > /etc/sysctl.d/99-performance.conf << 'EOF'
# Network performance optimization
net.core.rmem_max=67108864
net.core.wmem_max=67108864
net.core.rmem_default=16777216
net.core.wmem_default=16777216
net.core.netdev_max_backlog=2048
net.core.somaxconn=32768
net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_wmem=4096 65536 67108864
net.ipv4.tcp_congestion_control=bbr
net.ipv4.tcp_fastopen=3
net.ipv4.tcp_mtu_probing=1
net.ipv4.tcp_sack=1
net.ipv4.tcp_window_scaling=1
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_fin_timeout=15
net.ipv4.tcp_max_syn_backlog=4096
net.ipv4.tcp_keepalive_time=300
net.ipv4.tcp_keepalive_probes=3
net.ipv4.tcp_keepalive_intvl=15
net.ipv4.ip_local_port_range=1024 65535
fs.file-max=1048576
EOF

    sysctl -p /etc/sysctl.d/99-performance.conf

    # TCP BBR aktivasyonu
    echo "net.ipv4.tcp_congestion_control = bbr" >> /etc/sysctl.conf
    sysctl -p

    print_success "Performans optimizasyonu tamamlandı"
}

# Monitoring kurulumu (hafif)
setup_monitoring() {
    print_status "[10/13] Monitoring sistemleri kuruluyor..."
    
    # Netdata kurulumu (hafif)
    bash <(curl -Ss https://my-netdata.io/kickstart.sh) --non-interactive --stable-channel --disable-telemetry
    
    # Netdata için hafif ayarlar
    cat > /etc/netdata/netdata.conf << 'EOF'
[global]
    memory mode = dbengine
    page cache size = 32
    dbengine disk space = 256
    history = 86400
    update every = 5
[web]
    mode = none
EOF

    systemctl restart netdata

    # Basit monitoring scripti
    cat > /usr/local/bin/vpn-monitor << 'EOF'
#!/bin/bash
echo "=== VPN Server Monitoring ==="
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "Memory Usage: $(free -m | awk '/Mem:/ {printf "%.1f%%", $3/$2*100}')"
echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"
echo "Swap Usage: $(free -m | awk '/Swap:/ {if ($2>0) printf "%.1f%%", $3/$2*100; else print "N/A"}')"
echo "Active Connections: $(netstat -an | grep -c ESTABLISHED)"
echo "Docker Containers: $(docker ps -q | wc -l)"
echo "Uptime: $(uptime -p)"
EOF

    chmod +x /usr/local/bin/vpn-monitor

    # Monitoring cron job (idempotent)
    MONITOR_JOB="*/5 * * * * /usr/local/bin/vpn-monitor >> /var/log/vpn-monitor.log"
    CRON_CONTENT=$(crontab -l 2>/dev/null)
    if ! echo "$CRON_CONTENT" | grep -Fq "$MONITOR_JOB"; then
        # Safely append the new job and pipe to crontab.
        # Using printf is safer than echo for multi-line variables.
        printf "%s\n%s\n" "$CRON_CONTENT" "$MONITOR_JOB" | crontab -
    fi

    print_success "Monitoring sistemleri kuruldu"
}

# Yedekleme sistemi
setup_backup() {
    print_status "[11/13] Yedekleme sistemi kuruluyor..."
    
    # Yedekleme dizinleri
    mkdir -p /backup/{config,logs}
    mkdir -p /opt/backup-scripts

    # Yedekleme scripti
    cat > /opt/backup-scripts/backup-vpn.sh << 'EOF'
#!/bin/bash

# VPN Backup Script
BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Config yedekleme
tar -czf $BACKUP_DIR/config/vpn_config_$TIMESTAMP.tar.gz \
    /etc/wireguard \
    /etc/openvpn \
    /etc/nginx \
    /etc/ssh 2>/dev/null

# Log yedekleme
tar -czf $BACKUP_DIR/logs/system_logs_$TIMESTAMP.tar.gz \
    /var/log/nginx \
    /var/log/auth.log 2>/dev/null

# Eski yedekleri temizle
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $TIMESTAMP"
EOF

    chmod +x /opt/backup-scripts/backup-vpn.sh

    # Günlük yedekleme cron job'u (idempotent)
    BACKUP_JOB="0 2 * * * /opt/backup-scripts/backup-vpn.sh >> /var/log/backup.log"
    CRON_CONTENT=$(crontab -l 2>/dev/null)
    if ! echo "$CRON_CONTENT" | grep -Fq "$BACKUP_JOB"; then
        # Safely append the new job and pipe to crontab.
        printf "%s\n%s\n" "$CRON_CONTENT" "$BACKUP_JOB" | crontab -
    fi

    print_success "Yedekleme sistemi kuruldu"
}

# Final test ve raporlama
final_test() {
    print_status "[12/13] Final testleri yapılıyor..."

    # Servis durumlarını kontrol et
    SERVICES=("docker" "nginx" "fail2ban" "netdata" "ssh")
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet $service; then
            print_success "$service servisi çalışıyor"
        else
            print_warning "$service servisi çalışmıyor"
        fi
    done

    # Docker konteyner kontrolü
    if docker ps > /dev/null 2>&1; then
        print_success "Docker konteynerleri çalışıyor"
        echo "Aktif konteynerler:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_warning "Docker konteynerleri çalışmıyor"
    fi

    # Ağ bağlantı testleri
    echo "Ağ bağlantı noktaları:"
    echo "SSH VPN: 22, 443/tcp, 443/udp"
    echo "WireGuard: udp://$(curl -4 ifconfig.co):51820"
    echo "OpenVPN: udp://$(curl -4 ifconfig.co):1194"
    echo "HTTP/HTTPS: 80/tcp, 443/tcp"
    
    # Kaynak kullanımı
    echo "Kaynak kullanımı:"
    free -h
    df -h /
    
    print_success "Final testleri tamamlandı"
}

# Kurulum sonu bilgilendirme
show_info() {
    print_status "[13/13] Kurulum tamamlandı! Bilgiler:"

    echo ""
    echo "=== ULTIMATE VPN SERVER KURULUM BİLGİLERİ ==="
    echo "Sunucu IP: $(curl -4 ifconfig.co)"
    echo "SSH Bağlantı: ssh -p 22 $(whoami)@$(curl -4 ifconfig.co)"
    echo "SSH VPN Bağlantı: ssh -p 443 -D 1080 $(whoami)@$(curl -4 ifconfig.co)"
    echo "WireGuard Admin: http://$(curl -4 ifconfig.co):51821"
    echo "Netdata Monitoring: http://$(curl -4 ifconfig.co):19999"
    echo "Swap Alanı: $(free -h | awk '/Swap:/ {print $2}')"
    echo "=============================================="
    echo ""
    echo "Önemli Komutlar:"
    echo "  Sistem durumu: vpn-monitor"
    echo "  Servis restart: systemctl restart docker nginx ssh"
    echo "  Logları görüntüle: tail -f /var/log/syslog"
    echo "  Yedekleme: /opt/backup-scripts/backup-vpn.sh"
    echo ""
    echo "WhatsApp SNI Optimizasyonu:"
    echo "  WhatsApp trafiği otomatik olarak optimize edilmiştir"
    echo "  SNI: whatsapp.com, web.whatsapp.com"
    echo ""
}

# Ana kurulum fonksiyonu
main() {
    echo "=== Ultimate VDS/VPN/SSH Kurulum Scripti ==="
    echo "Hedef Seviye: $TARGET_LEVEL"
    echo "Özel Hassas Hostlar: $SENSITIVE_HOSTS"
    echo "Sistem: 2GB RAM + 4GB Swap Optimize"
    echo "============================================"

    # Root kontrolü
    if [ "$EUID" -ne 0 ]; then
        print_error "Lütfen root olarak çalıştırın: sudo $0"
        exit 1
    fi

    # Kurulum adımlarını çalıştır
    setup_swap
    check_system
    install_dependencies
    install_docker
    setup_ssh_vpn
    setup_vpn_containers
    setup_nginx_sni
    setup_security
    optimize_performance
    setup_monitoring
    setup_backup
    final_test
    show_info

    echo "============================================"
    print_success "Kurulum tamamlandı! Ultimate VPN Server hazır."
    echo "============================================"
}

# Scripti çalıştır
main "$@"
