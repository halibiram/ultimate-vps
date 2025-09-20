#!/bin/bash

# =================================================================
# Ultimate VPS SSH Manager Setup Script for Ubuntu
#
# This script automates the installation and configuration of the
# Ultimate VPS SSH Manager application on a fresh Ubuntu server.
# It follows the instructions from the README.md file.
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
# The user that will run the application.
APP_USER="ultimatevps"
# The directory where the application will be cloned/copied.
# Assumes the script is run from the project root.
APP_DIR=$(pwd)
# Database configuration
DB_NAME="ultimatevps_db"
DB_USER="ultimatevps_user"
DB_PASS=$(openssl rand -base64 16) # Generate a random password

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

    # 3. System Update and Dependency Installation
    print_status "Updating system and installing dependencies..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get upgrade -y
    # Install dependencies for Node.js repo
    apt-get install -y curl gnupg
    # Add Node.js 20.x repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    # Install main dependencies
    apt-get install -y nodejs postgresql redis-server stunnel4 dropbear build-essential
    print_success "System dependencies installed."

    # 4. Configure PostgreSQL
    print_status "Configuring PostgreSQL database..."
    systemctl enable --now postgresql
    # Use sudo -u postgres to execute commands as the 'postgres' user
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" &>/dev/null
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" &>/dev/null
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" &>/dev/null
    print_success "PostgreSQL database '$DB_NAME' and user '$DB_USER' created."

    # 5. Configure Redis
    print_status "Configuring Redis..."
    systemctl enable --now redis-server
    print_success "Redis is running."

    # 6. Set up Application Environment
    print_status "Setting up Node.js application environment..."

    # Create .env file
    JWT_SECRET=$(openssl rand -base64 32)
    cat > "$APP_DIR/.env" << EOF
# --- Database Configuration ---
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# --- Application Settings ---
JWT_SECRET="$JWT_SECRET"
REDIS_URL="redis://localhost:6379"

# --- Server Settings ---
PORT=3000
HOST="0.0.0.0"
EOF
    print_success ".env file created with generated credentials."

    # Set ownership of project files to the app user
    chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

    # 7. Install Node Dependencies and Build Project (as APP_USER)
    print_status "Installing npm packages and building the project..."
    sudo -u "$APP_USER" -H -- bash -c "cd $APP_DIR && npm install"
    if [ $? -ne 0 ]; then
        print_error "npm install failed. Please check for errors."
        exit 1
    fi

    print_status "Running Prisma migrations..."
    sudo -u "$APP_USER" -H -- bash -c "cd $APP_DIR && npx prisma migrate deploy"
    if [ $? -ne 0 ]; then
        print_error "Prisma migration failed. Please check the database connection and schema."
        exit 1
    fi

    print_status "Building TypeScript source..."
    sudo -u "$APP_USER" -H -- bash -c "cd $APP_DIR && npm run build"
    if [ $? -ne 0 ]; then
        print_error "TypeScript build failed."
        exit 1
    fi
    print_success "Project built successfully."

    # 8. Configure Sudoers for Service Commands
    print_status "Configuring passwordless sudo for the application..."
    # Commands needed by the application to manage users and services
    SUDOERS_FILE="/etc/sudoers.d/ultimate-vps"
    echo "$APP_USER ALL=(ALL) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /bin/systemctl, /usr/bin/openssl, /bin/tee, /usr/bin/sed" > "$SUDOERS_FILE"
    chmod 0440 "$SUDOERS_FILE"
    print_success "Sudoers file created at $SUDOERS_FILE."

    # 9. Create systemd Service
    print_status "Creating systemd service to run the application..."
    SYSTEMD_FILE="/etc/systemd/system/ultimate-vps.service"
    cat > "$SYSTEMD_FILE" << EOF
[Unit]
Description=Ultimate VPS SSH Manager
After=network.target postgresql.service redis-server.service

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$(which npm) run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=append:$APP_DIR/server.log
StandardError=append:$APP_DIR/server.log

[Install]
WantedBy=multi-user.target
EOF
    print_success "systemd service file created at $SYSTEMD_FILE."

    # 10. Start the Service
    print_status "Starting the application service..."
    systemctl daemon-reload
    systemctl enable --now ultimate-vps.service

    # Give it a moment to start
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
        echo "  Logs are stored at: $APP_DIR/server.log"
        echo "================================================================="
    else
        print_error "The service failed to start. Check the logs for errors:"
        echo "  journalctl -u ultimate-vps.service"
        echo "  or"
        echo "  tail -f $APP_DIR/server.log"
    fi
}

# --- Execute Script ---
main "$@"
