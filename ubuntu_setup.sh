#!/bin/bash

# =================================================================
# Ultimate VPS SSH Manager Setup Script for Ubuntu
#
# This script automates the installation and configuration of the
# Ultimate VPS SSH Manager application on a fresh Ubuntu server.
# It copies the project to /opt/ultimatevps to ensure correct
# permissions and location-independent execution.
#
# =================================================================

# --- Color Codes for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Log Functions ---
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Configuration ---
APP_USER="ultimatevps"
APP_INSTALL_DIR="/opt/ultimatevps"
APP_SOURCE_DIR=$(pwd)
DB_NAME="ultimatevps_db"
DB_USER="ultimatevps_user"
DB_PASS_RAW=$(openssl rand -base64 16) # Generate a random password
DB_PASS_ENCODED=$(echo -n "$DB_PASS_RAW" | node -p 'encodeURIComponent(require("fs").readFileSync(0, "utf-8").trim())')

# --- Main Setup Function ---
main() {
    print_status "Starting Ultimate VPS SSH Manager Setup..."

    # 1. Root Check
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root. Please use 'sudo bash $0'"
        exit 1
    fi

    # 2. Create Application User
    if id "$APP_USER" &>/dev/null; then
        print_warning "User '$APP_USER' already exists. Skipping creation."
    else
        print_status "Creating dedicated application user '$APP_USER'..."
        useradd -m -s /bin/bash "$APP_USER"
        print_success "User '$APP_USER' created."
    fi

    # 3. Prepare Application Directory
    print_status "Setting up application directory at $APP_INSTALL_DIR..."
    mkdir -p "$APP_INSTALL_DIR"
    # Use rsync to copy files, which is generally better than cp
    rsync -a --exclude='.git' --exclude='ubuntu_setup.sh' "$APP_SOURCE_DIR/" "$APP_INSTALL_DIR/"
    chown -R "$APP_USER":"$APP_USER" "$APP_INSTALL_DIR"
    print_success "Application files copied and permissions set."

    # 4. System Update and Dependency Installation
    print_status "Updating system and installing dependencies..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl gnupg
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs postgresql redis-server stunnel4 dropbear build-essential
    print_success "System dependencies installed."

    # 5. Configure PostgreSQL
    print_status "Configuring PostgreSQL database..."
    systemctl enable --now postgresql
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" &>/dev/null
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS_RAW';" &>/dev/null
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" &>/dev/null
    print_success "PostgreSQL database '$DB_NAME' and user '$DB_USER' created."

    # 6. Configure Redis
    print_status "Configuring Redis..."
    systemctl enable --now redis-server
    print_success "Redis is running."

    # 7. Set up Application Environment
    print_status "Setting up Node.js application environment in $APP_INSTALL_DIR..."
    JWT_SECRET=$(openssl rand -base64 32)
    cat > "$APP_INSTALL_DIR/.env" << EOF
# --- Database Configuration ---
DATABASE_URL="postgresql://$DB_USER:$DB_PASS_ENCODED@localhost:5432/$DB_NAME"

# --- Application Settings ---
JWT_SECRET="$JWT_SECRET"
REDIS_URL="redis://localhost:6379"

# --- Server Settings ---
PORT=3000
HOST="0.0.0.0"
EOF
    chown "$APP_USER":"$APP_USER" "$APP_INSTALL_DIR/.env"
    print_success ".env file created with generated credentials."

    # 8. Install Node Dependencies and Build Project (as APP_USER)
    print_status "Installing npm packages and building the project..."
    sudo -u "$APP_USER" -H -- bash -c "cd $APP_INSTALL_DIR && npm install"
    if [ $? -ne 0 ]; then
        print_error "npm install failed. Please check for errors."
        exit 1
    fi

    print_status "Running Prisma migrations..."
    sudo -u "$APP_USER" -H -- bash -c "cd $APP_INSTALL_DIR && npx prisma migrate deploy"
    if [ $? -ne 0 ]; then
        print_error "Prisma migration failed. Please check the database connection and schema."
        exit 1
    fi

    print_status "Building TypeScript source..."
    sudo -u "$APP_USER" -H -- bash -c "cd $APP_INSTALL_DIR && npm run build"
    if [ $? -ne 0 ]; then
        print_error "TypeScript build failed."
        exit 1
    fi
    print_success "Project built successfully."

    # 9. Configure Sudoers for Service Commands
    print_status "Configuring passwordless sudo for the application..."
    SUDOERS_FILE="/etc/sudoers.d/ultimate-vps"
    echo "$APP_USER ALL=(ALL) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /bin/systemctl, /usr/bin/openssl, /bin/tee, /usr/bin/sed" > "$SUDOERS_FILE"
    chmod 0440 "$SUDOERS_FILE"
    print_success "Sudoers file created at $SUDOERS_FILE."

    # 10. Create systemd Service
    print_status "Creating systemd service to run the application..."
    SYSTEMD_FILE="/etc/systemd/system/ultimate-vps.service"
    cat > "$SYSTEMD_FILE" << EOF
[Unit]
Description=Ultimate VPS SSH Manager
After=network.target postgresql.service redis-server.service

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_INSTALL_DIR
ExecStart=$(which npm) run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=append:$APP_INSTALL_DIR/server.log
StandardError=append:$APP_INSTALL_DIR/server.log

[Install]
WantedBy=multi-user.target
EOF
    print_success "systemd service file created at $SYSTEMD_FILE."

    # 11. Start the Service
    print_status "Starting the application service..."
    systemctl daemon-reload
    systemctl enable --now ultimate-vps.service

    sleep 5

    if systemctl is-active --quiet ultimate-vps.service; then
        PUBLIC_IP=$(curl -4s https://ifconfig.me)
        print_success "Application is now running!"
        echo ""
        echo "================================================================="
        echo "  Ultimate VPS SSH Manager is ready!"
        echo "  Access the web interface at: http://$PUBLIC_IP:3000"
        echo ""
        echo "  IMPORTANT: The first step is to register your admin account."
        echo "  You must do this via the API."
        echo "  Example using curl:"
        echo "  curl -X POST -H \"Content-Type: application/json\" \\"
        echo "       -d '{\"username\":\"admin\",\"password\":\"your-secure-password\"}' \\"
        echo "       http://localhost:3000/api/auth/register-admin"
        echo ""
        echo "  Logs are stored at: $APP_INSTALL_DIR/server.log"
        echo "================================================================="
    else
        print_error "The service failed to start. Check the logs for errors:"
        echo "  journalctl -u ultimate-vps.service"
        echo "  or"
        echo "  tail -f $APP_INSTALL_DIR/server.log"
    fi
}

# --- Execute Script ---
main "$@"
