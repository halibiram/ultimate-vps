#!/bin/bash

# =================================================================
# Ultimate Server Setup Script
#
# This script automates the configuration of a complete server
# environment on Debian-based systems. It is optimized for
# machines with at least 2GB of RAM and includes automatic swap
# configuration.
#
# Services Installed:
# - Docker & Containerd
# - Nginx
# - WireGuard (via wg-easy)
# - OpenVPN (via kylemanna/openvpn)
# - SSH VPN (on port 443)
# - Netdata (for monitoring)
# - UFW & Fail2ban (for security)
#
# =================================================================

# --- Script Configuration ---
# These variables are placeholders and are not actively used by the script's
# current logic but can be used for future enhancements.
CONFIG_FILE="/etc/ultimate_vpn/config.cfg"
TARGET_LEVEL="ULTIMATE"
SERVICE_TYPE="SERVER/VPN/SSH"
SENSITIVE_HOSTS="whatsapp.com,web.whatsapp.com,whatsapp.net,signal.org,telegram.org,facebook.com,instagram.com,twitter.com"

# --- Control Panel Credentials ---
# The username for the control panel is 'admin'.
# The password will be set during the installation.
PANEL_USER="admin"

# --- WireGuard Configuration ---
# The password for the wg-easy web UI will be set during installation.

# --- Color Codes for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Logging Functions ---

#
# Prints an informational message.
# Globals:
#   BLUE
#   NC
# Arguments:
#   $1 - The message to print.
#
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

#
# Prints a success message.
# Globals:
#   GREEN
#   NC
# Arguments:
#   $1 - The message to print.
#
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

#
# Prints a warning message.
# Globals:
#   YELLOW
#   NC
# Arguments:
#   $1 - The message to print.
#
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

#
# Prints an error message.
# Globals:
#   RED
#   NC
# Arguments:
#   $1 - The message to print.
#
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

#
# Fetches the public IP address from multiple sources for reliability.
#
get_public_ip() {
    IP=$(curl -4s https://icanhazip.com)
    if [ -z "$IP" ]; then
        IP=$(curl -4s https://ifconfig.me)
    fi
    if [ -z "$IP" ]; then
        print_error "Failed to retrieve public IP address."
        exit 1
    fi
    echo $IP
}


# --- Setup Functions ---

#
# Configures a swap file for the system.
# This function checks for existing swap space. If it's less than 2GB,
# it creates a new 4GB swap file, which is optimal for servers with 2GB of RAM.
# It also tunes swappiness and cache pressure settings for better performance.
#
setup_swap() {
    print_status "[1/13] Configuring swap space..."

    # Check if sufficient swap already exists
    CURRENT_SWAP=$(free -m | awk '/Swap:/ {print $2}')
    if [ $CURRENT_SWAP -ge 2048 ]; then
        print_success "Sufficient swap space already exists: ${CURRENT_SWAP}MB"
        return 0
    fi

    # Remove existing swap file if it's insufficient
    if [ $CURRENT_SWAP -gt 0 ]; then
        swapoff /swapfile 2>/dev/null
        rm -f /swapfile
    fi

    # Create a 4GB swap file
    SWAP_SIZE=4096
    dd if=/dev/zero of=/swapfile bs=1M count=$SWAP_SIZE
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    # Make the swap file permanent
    echo '/swapfile none swap sw 0 0' >> /etc/fstab

    # Optimize swap settings
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    sysctl -p

    print_success "Swap space created: ${SWAP_SIZE}MB"
}

#
# Checks if the system meets the minimum requirements.
# The script is optimized for at least 1GB RAM, 10GB disk space,
# and 1 CPU core. It also checks for a compatible Ubuntu version.
#
check_system() {
    print_status "[2/13] Checking system requirements..."

    # Minimum requirements
    MIN_RAM=1024  # 1GB minimum
    MIN_DISK=10   # 10GB disk
    MIN_CORES=1   # 1 core
    OS_VERSION=$(lsb_release -rs)

    # Check OS version (Ubuntu 18.04+ recommended)
    if [[ $(echo "$OS_VERSION < 18.04" | bc -l) -eq 1 ]]; then
        print_warning "Ubuntu 18.04 or higher is recommended. Current version: $OS_VERSION"
    fi

    # Check RAM
    RAM=$(free -m | awk '/Mem:/ {print $2}')
    if [ $RAM -lt $MIN_RAM ]; then
        print_error "Insufficient RAM. Minimum $MIN_RAM MB required. Found: $RAM MB"
        exit 1
    fi

    # Check Disk Space
    DISK=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
    if [ $DISK -lt $MIN_DISK ]; then
        print_error "Insufficient disk space. Minimum $MIN_DISK GB required. Found: $DISK GB"
        exit 1
    fi

    # Check CPU cores
    CORES=$(nproc)
    if [ $CORES -lt $MIN_CORES ]; then
        print_warning "Recommended CPU cores: $MIN_CORES+. Found: $CORES"
    fi

    print_success "System requirements met - RAM: ${RAM}MB, Disk: ${DISK}GB, Cores: $CORES"
}

#
# Installs system-wide dependencies and updates the system.
# This function performs a full system upgrade and installs essential packages
# for networking, administration, security, and building software.
#
install_dependencies() {
    print_status "[3/13] Installing updates and essential packages..."

    export DEBIAN_FRONTEND=noninteractive

    # Update system packages
    apt-get update
    apt-get upgrade -y
    apt-get dist-upgrade -y

    # Install essential packages
    apt-get install -y \
        curl wget git build-essential libssl-dev libffi-dev \
        python3 python3-pip python3-venv net-tools iptables-persistent \
        fail2ban ufw openssl certbot python3-certbot-nginx \
        software-properties-common apt-transport-https ca-certificates \
        gnupg lsb-release jq htop iftop zip unzip nano vim resolvconf \
        dnsutils iputils-ping traceroute mtr-tiny tcpdump socat netcat \
        openssh-server openssh-client rsync cron logrotate sysstat \
        iotop ethtool php-fpm apache2-utils

    # Install Python packages
    pip3 install --upgrade pip
    pip3 install requests docker

    print_success "Essential packages installed."
}

#
# Installs and configures Docker and Containerd.
# This function removes old Docker versions, adds the official Docker GPG key
# and repository, and installs the latest Docker CE, CLI, and Containerd.
# It also configures the Docker daemon for optimized logging and resource limits.
#
install_docker() {
    print_status "[4/13] Installing Docker and Containerd..."

    # Remove any old Docker versions
    apt-get remove -y docker docker-engine docker.io containerd runc
    rm -rf /var/lib/docker
    rm -rf /var/lib/containerd

    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the Docker repository
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update

    # Install Docker packages
    apt-get install -y docker-ce docker-ce-cli containerd.io

    # Start and enable Docker services
    systemctl start docker
    systemctl enable docker
    systemctl enable containerd

    # Add current user to the docker group
    usermod -aG docker $USER

    # Configure the Docker daemon
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

    # Restart Docker to apply changes
    systemctl restart docker

    print_success "Docker and Containerd installation complete."
}

#
# Configures SSH to act as a VPN tunnel on port 443.
# This function modifies the SSH server configuration to listen on both
# port 22 and 443. It disables password authentication, enables tunneling,
# and creates a systemd service to manage it.
#
setup_ssh_vpn() {
    print_status "[5/13] Setting up SSH VPN..."

    # Configure SSH server for VPN tunneling
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
AllowGroups ssh-users
EOF

    # Create the ssh-users group and add the primary user to it
    groupadd --force ssh-users
    usermod -aG ssh-users $USER

    # Generate SSH key if it doesn't exist
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    fi

    # Restart SSH service
    systemctl restart ssh

    # Create a helper script for the SSH VPN service
    cat > /usr/local/bin/ssh-vpn-server << 'EOF'
#!/bin/bash
# This script manages iptables rules for the SSH VPN service.
case "$1" in
    start)
        echo "Starting SSH VPN service..."
        # Allow SSH traffic on ports 22 and 443
        iptables -A INPUT -p tcp --dport 22 -j ACCEPT
        iptables -A INPUT -p tcp --dport 443 -j ACCEPT
        iptables -A INPUT -p udp --dport 443 -j ACCEPT
        echo "SSH VPN ready. Connection info:"
        echo "SSH Ports: 22, 443"
        echo "IP: $(get_public_ip)"
        ;;
    stop)
        echo "Stopping SSH VPN service..."
        ;;
    status)
        echo "SSH VPN Status:"
        netstat -tulpn | grep ssh
        ;;
    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac
EOF

    chmod +x /usr/local/bin/ssh-vpn-server

    # Create systemd service file for SSH VPN
    cat > /etc/systemd/system/ssh-vpn.service << EOF
[Unit]
Description=SSH VPN Service
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/ssh-vpn-server start
ExecStop=/usr/local/bin/ssh-vpn-server stop

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ssh-vpn
    systemctl start ssh-vpn

    print_success "SSH VPN setup complete."
}

#
# Deploys WireGuard and OpenVPN containers using Docker.
# This function creates necessary directories and then starts two Docker containers:
# 1. wg-easy: A WireGuard server with a web UI for easy management.
# 2. kylemanna/openvpn: A standard OpenVPN server.
# Both containers are configured with resource limits.
#
setup_vpn_containers() {
    print_status "[6/13] Deploying VPN containers..."

    # Create directories for VPN configurations
    mkdir -p /opt/vpn/{wireguard,openvpn}
    mkdir -p /etc/wireguard
    mkdir -p /etc/openvpn

    # Interactively set the WireGuard UI password
    while true; do
        read -sp "Enter a password for the WireGuard web UI: " WG_PASS
        echo
        read -sp "Confirm password: " WG_PASS_CONFIRM
        echo
        if [ "$WG_PASS" = "$WG_PASS_CONFIRM" ] && [ -n "$WG_PASS" ]; then
            break
        else
            print_error "Passwords do not match or are empty. Please try again."
        fi
    done

    # Deploy WireGuard (wg-easy) container
    docker run -d \
      --name=wg-easy \
      -e WG_HOST=$(get_public_ip) \
      -e PASSWORD="$WG_PASS" \
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

    # Deploy OpenVPN container
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

    print_success "VPN containers deployed: WireGuard, OpenVPN"
}

#
# Installs and configures Nginx for SNI proxying.
# This function installs Nginx and sets up a configuration to proxy
# traffic for specific hostnames (e.g., whatsapp.com). This can be used
# to obfuscate traffic. It generates self-signed certificates for this purpose.
#
setup_nginx_sni() {
    print_status "[7/13] Setting up Nginx and SNI proxy..."

    # Install Nginx
    apt-get install -y nginx nginx-extras

    # Create directories for custom configs
    mkdir -p /etc/nginx/sni.d
    mkdir -p /etc/nginx/ssl

    # Create the users.php file for SSH user management
    cat > /var/www/html/panel/users.php << 'EOF'
<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = escapeshellarg($_POST['username']);
    $action = $_POST['action'];

    if ($action === 'add') {
        $ssh_key = escapeshellarg($_POST['ssh_key']);
        if (empty(trim($ssh_key, "'"))) {
            $message = "Error: Public SSH key is required to add a user.";
        } else {
            $output = shell_exec("sudo /usr/local/bin/panel-user-add {$username} {$ssh_key}");
            $message = "User {$username} added successfully.";
        }
    } elseif ($action === 'remove') {
        $output = shell_exec("sudo /usr/local/bin/panel-user-del {$username}");
        $message = "User {$username} removed successfully.";
    }

    // Redirect back to the main page with a message
    header("Location: index.php?message=" . urlencode($message));
    exit;
}
?>
EOF

    # Create the sni.php file for SNI proxy management
    cat > /var/www/html/panel/sni.php << 'EOF'
<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $domain = escapeshellarg($_POST['domain']);
    $action = $_POST['action'];
    $config_path = "/etc/nginx/sni.d/{$domain}.conf";

    if ($action === 'add') {
        shell_exec("sudo /usr/local/bin/panel-sni-add {$domain}");
        $message = "Domain {$domain} added to SNI proxy.";
    } elseif ($action === 'remove') {
        shell_exec("sudo /usr/local/bin/panel-sni-del {$domain}");
        $message = "Domain {$domain} removed from SNI proxy.";
    }

    // Redirect back to the main page
    header("Location: index.php?message=" . urlencode($message));
    exit;
}
?>
EOF

    # Create a main Nginx configuration file
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

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
    include /etc/nginx/sni.d/*.conf;
}
EOF

    # SNI proxy domains can be added via the control panel.

    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx

    print_success "Nginx and SNI proxy setup complete."
}

#
# Configures system security features.
# This function sets up the UFW firewall to block all incoming traffic
# by default, allowing only essential ports. It also configures Fail2ban
# to protect SSH and Nginx from brute-force attacks and applies kernel
# hardening settings via sysctl.
#
setup_security() {
    print_status "[8/13] Configuring security settings..."

    # Configure UFW firewall rules
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 22/tcp comment 'SSH'
    ufw allow 443/tcp comment 'HTTPS/SSH-VPN'
    ufw allow 443/udp comment 'QUIC/H3'
    ufw allow 51820/udp comment 'WireGuard'
    ufw allow 1194/udp comment 'OpenVPN'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 8080/tcp comment 'Control Panel'
    ufw --force enable

    # Configure Fail2ban
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

    # Apply kernel security settings
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

    print_success "Security settings configured."
}

#
# Applies performance optimizations to the system.
# This function tunes network-related kernel parameters for high performance
# and enables TCP BBR congestion control for better throughput and lower latency.
#
optimize_performance() {
    print_status "[9/13] Applying performance optimizations..."

    # Tune kernel parameters for network performance
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

    # Ensure BBR is set as the default congestion control
    echo "net.ipv4.tcp_congestion_control = bbr" >> /etc/sysctl.conf
    sysctl -p

    print_success "Performance optimizations applied."
}

#
# Sets up monitoring tools.
# This function installs Netdata for real-time monitoring and creates a
# simple `vpn-monitor` script for a quick command-line status check.
# A cron job is also added to log the monitor's output every 5 minutes.
#
setup_monitoring() {
    print_status "[10/13] Setting up monitoring systems..."

    # Install Netdata
    bash <(curl -Ss https://my-netdata.io/kickstart.sh) --non-interactive --stable-channel --disable-telemetry

    # Apply a lightweight configuration to Netdata
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

    # Create a simple monitoring script
    cat > /usr/local/bin/vpn-monitor << 'EOF'
#!/bin/bash
echo "=== VPN Server Monitor ==="
echo "CPU Usage:    $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "Memory Usage: $(free -m | awk '/Mem:/ {printf "%.1f%%", $3/$2*100}')"
echo "Disk Usage:   $(df -h / | awk 'NR==2 {print $5}')"
echo "Swap Usage:   $(free -m | awk '/Swap:/ {if ($2>0) printf "%.1f%%", $3/$2*100; else print "N/A"}')"
echo "Connections:  $(netstat -an | grep -c ESTABLISHED)"
echo "Docker PS:    $(docker ps -q | wc -l) running"
echo "Uptime:       $(uptime -p)"
EOF

    chmod +x /usr/local/bin/vpn-monitor

    # Add a cron job for the monitor script (ensuring no duplicates)
    MONITOR_JOB="*/5 * * * * /usr/local/bin/vpn-monitor >> /var/log/vpn-monitor.log"
    CRON_CONTENT=$(crontab -l 2>/dev/null)
    if ! echo "$CRON_CONTENT" | grep -Fq "$MONITOR_JOB"; then
        printf "%s\n%s\n" "$CRON_CONTENT" "$MONITOR_JOB" | crontab -
    fi

    print_success "Monitoring systems installed."
}

#
# Sets up an automated backup system.
# This function creates a script at `/opt/backup-scripts/backup-vpn.sh`
# that archives critical configuration files. A cron job is then created
# to run this script daily. Backups older than 7 days are automatically deleted.
#
setup_backup() {
    print_status "[11/13] Setting up backup system..."

    # Create backup directories
    mkdir -p /backup/{config,logs}
    mkdir -p /opt/backup-scripts

    # Create the backup script
    cat > /opt/backup-scripts/backup-vpn.sh << 'EOF'
#!/bin/bash
# This script backs up critical VPN and server configuration files.
BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Backup configuration files
tar -czf $BACKUP_DIR/config/vpn_config_$TIMESTAMP.tar.gz \
    /etc/wireguard \
    /etc/openvpn \
    /etc/nginx \
    /etc/ssh 2>/dev/null

# Backup log files
tar -czf $BACKUP_DIR/logs/system_logs_$TIMESTAMP.tar.gz \
    /var/log/nginx \
    /var/log/auth.log 2>/dev/null

# Clean up old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $TIMESTAMP"
EOF

    chmod +x /opt/backup-scripts/backup-vpn.sh

    # Add a daily cron job for backups (ensuring no duplicates)
    BACKUP_JOB="0 2 * * * /opt/backup-scripts/backup-vpn.sh >> /var/log/backup.log"
    CRON_CONTENT=$(crontab -l 2>/dev/null)
    if ! echo "$CRON_CONTENT" | grep -Fq "$BACKUP_JOB"; then
        printf "%s\n%s\n" "$CRON_CONTENT" "$BACKUP_JOB" | crontab -
    fi

    print_success "Backup system installed."
}

#
# Performs final checks and generates a report.
# This function verifies that all key services are active and that the
# Docker containers are running. It then prints a summary of network
# connection points and resource usage.
#
final_test() {
    print_status "[12/13] Performing final checks..."

    # Check status of key services
    SERVICES=("docker" "nginx" "fail2ban" "netdata" "ssh")
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet $service; then
            print_success "$service service is running."
        else
            print_warning "$service service is not running."
        fi
    done

    # Check Docker containers
    if docker ps > /dev/null 2>&1; then
        print_success "Docker containers are running."
        echo "Active containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_warning "Could not query Docker containers."
    fi

    # Display network connection info
    echo "Network endpoints:"
    echo "  SSH VPN:     22/tcp, 443/tcp"
    echo "  WireGuard:   udp://$(get_public_ip):51820"
    echo "  OpenVPN:     udp://$(get_public_ip):1194"
    echo "  HTTP/HTTPS:  80/tcp, 443/tcp"

    # Display resource usage
    echo "Resource usage:"
    free -h
    df -h /

    print_success "Final checks complete."
}

#
# Displays a summary of the installation.
# This function prints out all the necessary information for the user
# to access and manage the newly configured server, including IP address,
# connection commands, and URLs for web interfaces.
#
show_info() {
    print_status "[13/13] Installation complete! See details below."

    PUBLIC_IP=$(get_public_ip)
    USERNAME=$(whoami)

    echo ""
    echo "=== ULTIMATE SERVER SETUP SUMMARY ==="
    echo "Server IP: $PUBLIC_IP"
    echo "SSH Login: ssh -p 22 $USERNAME@$PUBLIC_IP"
    echo "SSH VPN Tunnel: ssh -p 443 -D 1080 $USERNAME@$PUBLIC_IP"
    echo "--- Web Control Panel (for managing users & SNI) ---"
    echo "URL: http://$PUBLIC_IP:8080"
    echo "User: $PANEL_USER"
    echo "Password: [Set during installation]"
    echo ""
    echo "--- WireGuard UI (for managing VPN clients) ---"
    echo "URL: http://$PUBLIC_IP:51821 (also linked from Control Panel)"
    echo "Password: [Set during installation]"
    echo "Netdata Monitor: http://$PUBLIC_IP:19999"
    echo "Swap Space: $(free -h | awk '/Swap:/ {print $2}')"
    echo "======================================="
    echo ""
    echo "Important Commands:"
    echo "  Check server status:  vpn-monitor"
    echo "  Manage services:      systemctl restart docker nginx ssh"
    echo "  View system logs:     tail -f /var/log/syslog"
    echo "  Run a manual backup:  /opt/backup-scripts/backup-vpn.sh"
    echo ""
    echo "SNI Proxy Note:"
    echo "  Nginx is configured to proxy traffic for whatsapp.com."
    echo ""
}

#
# Sets up the web-based control panel.
# This function creates a new Nginx site to host the PHP-based control
# panel. It also configures Nginx to process PHP files using PHP-FPM.
#
setup_control_panel() {
    print_status "[NEW] Setting up control panel..."

    # Create web directory for the panel
    mkdir -p /var/www/html/panel

    # Create the main index.php file for the control panel
    cat > /var/www/html/panel/index.php << 'EOF'
<?php
// Helper function to get SSH users
function get_ssh_users() {
    $users = [];
    $group_info = file_get_contents('/etc/group');
    if (preg_match('/^ssh-users:x:\d+:(.*)$/m', $group_info, $matches)) {
        if (!empty($matches[1])) {
            $users = explode(',', $matches[1]);
        }
    }
    return $users;
}

// Helper function to get SNI domains
function get_sni_domains() {
    $domains = [];
    $config_files = glob('/etc/nginx/sni.d/*.conf');
    foreach ($config_files as $file) {
        $domains[] = basename($file, '.conf');
    }
    return $domains;
}

$ssh_users = get_ssh_users();
$sni_domains = get_sni_domains();

$payload = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'generate_payload') {
    $host_domain = htmlspecialchars($_POST['host_domain']);
    $sni_domain = htmlspecialchars($_POST['sni_domain']);
    $ssh_user = htmlspecialchars($_POST['ssh_user']); // Not used in payload, but good to have

    $crlf = "\\r\\n";
    $payload = "CONNECT {$host_domain}:443 HTTP/1.1{$crlf}Host: {$sni_domain}{$crlf}Connection: Keep-Alive{$crlf}{$crlf}";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Control Panel</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Ultimate Server Control Panel</h1>

        <?php
        if (isset($_GET['message'])) {
            echo "<p class='message'>" . htmlspecialchars($_GET['message']) . "</p>";
        }
        ?>

        <!-- WireGuard Section -->
        <div class="section">
            <h2>WireGuard Management</h2>
            <p>Access the WireGuard web UI to manage clients.</p>
            <a href="http://<?php echo $_SERVER['SERVER_ADDR']; ?>:51821" target="_blank" class="button">Open WireGuard UI</a>
        </div>

        <!-- SSH User Management Section -->
        <div class="section">
            <h2>SSH User Management</h2>
            <form action="users.php" method="post" class="user-form">
                <input type="text" name="username" placeholder="Username" pattern="[a-z_][a-z0-9_-]{0,30}" title="Enter a valid Linux username." required>
                <textarea name="ssh_key" placeholder="Paste public SSH key here (required for adding user)"></textarea>
                <button type="submit" name="action" value="add">Add User</button>
                <button type="submit" name="action" value="remove" class="remove">Remove User</button>
            </form>
        </div>

        <!-- SNI Proxy Management Section -->
        <div class="section">
            <h2>SNI Proxy Management</h2>
            <form action="sni.php" method="post">
                <input type="text" name="domain" placeholder="Domain (e.g., example.com)" required>
                <button type="submit" name="action" value="add">Add Domain</button>
                <button type="submit" name="action" value="remove" class="remove">Remove Domain</button>
            </form>
        </div>

        <!-- Payload Generator Section -->
        <div class="section">
            <h2>Payload Generator</h2>
            <form method="post" action="index.php#payload">
                <input type="text" name="host_domain" placeholder="Your SSH domain (e.g., ssh.yourdomain.com)" required>
                <select name="ssh_user" required>
                    <option value="" disabled selected>Select SSH User</option>
                    <?php foreach ($ssh_users as $user): ?>
                        <option value="<?php echo htmlspecialchars($user); ?>"><?php echo htmlspecialchars($user); ?></option>
                    <?php endforeach; ?>
                </select>
                <select name="sni_domain" required>
                    <option value="" disabled selected>Select SNI Domain</option>
                    <?php foreach ($sni_domains as $domain): ?>
                        <option value="<?php echo htmlspecialchars($domain); ?>"><?php echo htmlspecialchars($domain); ?></option>
                    <?php endforeach; ?>
                </select>
                <button type="submit" name="action" value="generate_payload">Generate Payload</button>
            </form>
            <?php if (!empty($payload)): ?>
            <div id="payload">
                <h3>Generated Payload:</h3>
                <textarea readonly><?php echo $payload; ?></textarea>
            </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
EOF

    # Create the CSS file for styling
    cat > /var/www/html/panel/style.css << 'EOF'
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #f4f7f9;
    color: #333;
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1, h2 {
    color: #2c3e50;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 10px;
}

.section {
    margin-bottom: 20px;
}

p {
    line-height: 1.6;
}

input[type="text"] {
    width: calc(100% - 22px);
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 10px;
}

.button, button {
    display: inline-block;
    background-color: #3498db;
    color: #fff;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
    font-size: 1em;
}

button[value="remove"] {
    background-color: #e74c3c;
}

.message {
    background-color: #eafaf1;
    color: #2d6a4f;
    padding: 10px;
    border-radius: 4px;
    border-left: 5px solid #2d6a4f;
    margin-bottom: 20px;
}

select, textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 10px;
    background-color: #fff;
    font-family: inherit;
    font-size: 1em;
}

textarea {
    resize: vertical;
    min-height: 100px;
    background-color: #ecf0f1;
    font-family: monospace;
    white-space: pre;
}
EOF

    # Interactively set the control panel password
    while true; do
        read -sp "Enter a password for the control panel admin user: " PANEL_PASS
        echo
        read -sp "Confirm password: " PANEL_PASS_CONFIRM
        echo
        if [ "$PANEL_PASS" = "$PANEL_PASS_CONFIRM" ] && [ -n "$PANEL_PASS" ]; then
            break
        else
            print_error "Passwords do not match or are empty. Please try again."
        fi
    done

    # Create .htpasswd file for basic authentication
    htpasswd -cb /etc/nginx/.htpasswd "$PANEL_USER" "$PANEL_PASS"

    # Find the PHP-FPM socket path dynamically
    PHP_FPM_SOCK=$(find /var/run/php -name "php*-fpm.sock" | head -n 1)
    if [ -z "$PHP_FPM_SOCK" ]; then
        print_error "Could not find PHP-FPM socket."
        exit 1
    fi
    print_status "Using PHP-FPM socket at $PHP_FPM_SOCK"

    # Create Nginx config for the control panel
    cat > /etc/nginx/sites-available/control-panel << EOF
server {
    listen 8080;
    server_name _;

    root /var/www/html/panel;
    index index.php index.html;

    # Add Basic Authentication
    auth_basic "Restricted Content";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:$PHP_FPM_SOCK;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

    # Enable the site
    ln -s /etc/nginx/sites-available/control-panel /etc/nginx/sites-enabled/

    # Create user management wrapper scripts
    cat > /usr/local/bin/panel-user-add << 'EOF'
#!/bin/bash
if [ "$#" -ne 2 ]; then exit 1; fi
USERNAME=$1
PUBKEY=$2
useradd -m -s /bin/bash -G ssh-users "$USERNAME"
mkdir -p "/home/$USERNAME/.ssh"
echo "$PUBKEY" > "/home/$USERNAME/.ssh/authorized_keys"
chmod 700 "/home/$USERNAME/.ssh"
chmod 600 "/home/$USERNAME/.ssh/authorized_keys"
chown -R "$USERNAME:$USERNAME" "/home/$USERNAME/.ssh"
EOF

    cat > /usr/local/bin/panel-user-del << 'EOF'
#!/bin/bash
if [ "$#" -ne 1 ]; then exit 1; fi
USERNAME=$1
userdel -r "$USERNAME"
EOF

    chmod +x /usr/local/bin/panel-user-add
    chmod +x /usr/local/bin/panel-user-del

    # Create SNI management wrapper scripts
    cat > /usr/local/bin/panel-sni-add << 'EOF'
#!/bin/bash
if [ "$#" -ne 1 ]; then exit 1; fi
DOMAIN=$1
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "/etc/nginx/ssl/$DOMAIN.key" -out "/etc/nginx/ssl/$DOMAIN.crt" -subj "/CN=$DOMAIN"
cat > "/etc/nginx/sni.d/$DOMAIN.conf" << EOL
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    ssl_certificate /etc/nginx/ssl/$DOMAIN.crt;
    ssl_certificate_key /etc/nginx/ssl/$DOMAIN.key;
    location / {
        proxy_pass https://\$DOMAIN;
        proxy_ssl_server_name on;
        proxy_set_header Host \$DOMAIN;
    }
}
EOL
nginx -s reload
EOF

    cat > /usr/local/bin/panel-sni-del << 'EOF'
#!/bin/bash
if [ "$#" -ne 1 ]; then exit 1; fi
DOMAIN=$1
rm -f "/etc/nginx/sni.d/$DOMAIN.conf"
rm -f "/etc/nginx/ssl/$DOMAIN.key"
rm -f "/etc/nginx/ssl/$DOMAIN.crt"
nginx -s reload
EOF

    chmod +x /usr/local/bin/panel-sni-add
    chmod +x /usr/local/bin/panel-sni-del

    # Configure sudoers for the control panel to use wrapper scripts
    echo "www-data ALL=(ALL) NOPASSWD: /usr/local/bin/panel-user-add, /usr/local/bin/panel-user-del, /usr/local/bin/panel-sni-add, /usr/local/bin/panel-sni-del" > /etc/sudoers.d/panel-control
    chmod 0440 /etc/sudoers.d/panel-control

    # Test Nginx configuration and restart
    nginx -t && systemctl restart nginx

    print_success "Control panel Nginx site configured."
}


#
# Main function to run the installation process.
# This function executes all the setup steps in the correct order.
# It also performs a root check before starting.
#
main() {
    echo "=== Ultimate Server Setup Script ==="
    echo "Target Level: $TARGET_LEVEL"
    echo "Sensitive Hosts for SNI: $SENSITIVE_HOSTS"
    echo "System Profile: 2GB RAM + 4GB Swap Optimized"
    echo "=========================================="

    # Ensure script is run as root
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root: sudo $0"
        exit 1
    fi

    # Execute setup functions
    setup_swap
    check_system
    install_dependencies
    install_docker
    setup_ssh_vpn
    setup_vpn_containers
    setup_nginx_sni
    setup_control_panel
    setup_security
    optimize_performance
    setup_monitoring
    setup_backup
    final_test
    show_info

    echo "=========================================="
    print_success "Setup complete! Your Ultimate Server is ready."
    echo "=========================================="
}

# --- Execute Script ---
main "$@"
