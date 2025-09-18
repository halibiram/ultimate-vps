# Ultimate Server Setup Script

This script is designed to automate the setup and configuration of a robust server environment on Debian-based Linux distributions. It installs and configures essential services for hosting, VPN, and security, making it ideal for a personal all-in-one server.

The script is optimized for servers with at least 2GB of RAM and will automatically create and configure a swap file to ensure stable performance.

## 🚀 Features

- **System Optimization:**
  - **Swap Management:** Automatically creates a 4GB swap file, ideal for systems with 2GB of RAM, and optimizes swappiness settings.
  - **Performance Tuning:** Applies advanced `sysctl` configurations to optimize network and kernel performance, including enabling BBR congestion control.
  - **Resource Limits:** Increases system-wide file descriptor and process limits for better scalability.

- **Essential Services:**
  - **Docker Engine:** Installs and configures Docker and Containerd for easy application deployment.
  - **Nginx Web Server:** Sets up Nginx with a secure and optimized default configuration.
  - **SNI Proxying:** Includes a basic Nginx setup to proxy traffic for specific hostnames, which can be adapted for traffic obfuscation.

- **VPN Services:**
  - **WireGuard:** Deploys `wg-easy`, a user-friendly WireGuard server with a web UI for easy client management.
  - **OpenVPN:** Deploys a standard OpenVPN server using the `kylemanna/openvpn` Docker image.
  - **SSH VPN Tunnel:** Configures the SSH server to allow tunneling on port 443, providing a simple and effective VPN alternative.

- **Security & Hardening:**
  - **UFW Firewall:** Configures a strict firewall with rules to allow only essential traffic (SSH, HTTP/S, VPN ports).
  - **Fail2ban:** Installs and configures Fail2ban to protect SSH and Nginx from brute-force attacks.
  - **Kernel Hardening:** Applies security-focused `sysctl` settings to protect against common network-level threats.

- **Monitoring & Maintenance:**
  - **Netdata:** Installs Netdata for real-time performance monitoring with a lightweight configuration.
  - **Custom Monitoring Script:** Provides a `vpn-monitor` command for a quick overview of server status (CPU, RAM, disk, active connections).
  - **Automated Backups:** Sets up a daily cron job to back up critical configuration files for Nginx, VPNs, and SSH.

## 🛠️ Installation

To use the script, download it to your server, make it executable, and run it with `sudo` privileges.

```bash
# Download the script
wget https://raw.githubusercontent.com/your-username/your-repo/main/setup.sh

# Make it executable
chmod +x setup.sh

# Run with root privileges
sudo ./setup.sh
```

The script will proceed automatically and requires no user input.

## 📄 Post-Installation Guide

After the script completes, your server will be fully configured. Here is the key information you'll need:

- **Server IP:** The script will display your server's public IP address upon completion.

- **Accessing Services:**
  - **SSH:** Connect as usual on port `22`.
    ```bash
    ssh your-user@your_server_ip
    ```
  - **SSH VPN Tunnel:** Use port `443` to create a SOCKS5 proxy.
    ```bash
    ssh -p 443 -D 1080 your-user@your_server_ip
    ```
  - **WireGuard Web UI:** Access the admin interface to add clients and manage connections.
    - **URL:** `http://your_server_ip:51821`
    - **Password:** The password is randomly generated and can be found in the Docker container logs: `docker logs wg-easy`
  - **Netdata Monitoring:** View real-time server metrics.
    - **URL:** `http://your_server_ip:19999`

- **Important Commands:**
  - **Check Server Status:** Get a quick performance summary.
    ```bash
    vpn-monitor
    ```
  - **Manage Services:** Use `systemctl` to control the key services.
    ```bash
    sudo systemctl status docker nginx ssh fail2ban
    sudo systemctl restart nginx
    ```
  - **View Logs:**
    - **System Log:** `tail -f /var/log/syslog`
    - **Monitoring Log:** `cat /var/log/vpn-monitor.log`
    - **Backup Log:** `cat /var/log/backup.log`

- **Backup Files:**
  - Configuration backups are stored in `/backup/config/`.
  - Log backups are stored in `/backup/logs/`.
  - The backup script is located at `/opt/backup-scripts/backup-vpn.sh`.
