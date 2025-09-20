# Ultimate VPS SSH Manager

A web-based application to manage users and their SSH accounts on a Virtual Private Server (VPS). It provides a simple, modern interface to create, update, and monitor SSH accounts, manage Stunnel, and view real-time server statistics.

The application is built with a **TypeScript** backend using **Fastify** and **Prisma**, and a vanilla **JavaScript** frontend.

## 🚀 Features

- **Secure User Authentication:** JWT-based authentication system for protecting administrative actions.
- **Initial Admin Setup:** A one-time, secure endpoint for registering the primary admin user.
- **Full SSH Account Management:**
    - **Create:** Add new system users with passwords, expiry dates, and login limits.
    - **View:** See a list of all SSH accounts with their status and number of active connections.
    - **Toggle:** Activate or deactivate accounts, which locks or unlocks the system user.
    - **Delete:** Remove SSH accounts from both the database and the operating system.
- **Stunnel Integration:**
    - **Enable/Disable Stunnel:** Easily enable or disable Stunnel to wrap SSH connections in SSL, helping to bypass restrictive firewalls.
    - **Status Check:** View the current status of the Stunnel service.
- **Dropbear Integration:**
    - **Enable/Disable Dropbear:** Easily enable or disable the lightweight Dropbear SSH server as an alternative to OpenSSH.
    - **Status Check:** View the current status of the Dropbear service.
- **Real-Time Server Monitoring:**
    - **System Stats:** View live CPU, RAM, and disk usage.
    - **Network Status:** Monitor active connections on key ports (e.g., SSH, Dropbear).
- **Web-based UI:** A simple and intuitive single-page application for managing the server.
- **Modern Tech Stack:** Powered by Fastify, Prisma, TypeScript, and vanilla JavaScript for a fast and reliable experience.

## Project Structure

The repository is organized into a `src` directory for the backend source code, a `public` directory for the frontend, and `prisma` for database management.

```
.
├── public/               # Frontend assets (HTML, CSS, JS)
│   ├── css/
│   │   └── dashboard.css
│   ├── js/
│   │   └── dashboard.js  # Main frontend application logic
│   └── index.html        # The single-page application entry point
├── src/                  # Backend TypeScript source code
│   ├── controllers/      # Request handlers and business logic
│   ├── routes/           # API route definitions (Fastify plugins)
│   ├── services/         # Services that interact with external resources (e.g., shell)
│   ├── utils/            # Utility functions (e.g., authentication middleware)
│   └── server.ts         # Main server entry point
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma
├── .env.example          # Example environment variables
├── package.json
└── tsconfig.json
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Automated Setup on Ubuntu

For a fast and easy setup on a fresh Ubuntu server, you can use the provided setup script. This will install all dependencies, configure the database, and set up the application to run as a service.

```bash
# Make sure the script is executable
chmod +x ubuntu_setup.sh

# Run the script as root
sudo ./ubuntu_setup.sh
```

This is the recommended method for deploying the application on a new server. For manual installation, follow the steps below.

### Manual Installation Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Stunnel](https://www.stunnel.org/) (v5 or higher) installed on the server.
- [Dropbear](https://matt.ucc.asn.au/dropbear/dropbear.html) SSH server installed on the server.
- `sudo` access for the user running the application, to manage system users and services.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo.git
    cd your-repo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the environment:**
    - Create a `.env` file in the root of the project (you can copy `.env.example`).
    - Add your PostgreSQL connection string, a JWT secret, and a Redis URL to the `.env` file:
      ```env
      DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
      JWT_SECRET="your-super-secret-key"
      REDIS_URL="redis://localhost:6379"
      ```
    - **Note:** The `JWT_SECRET` should be a long, random, and secret string.

4.  **Run database migrations:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Install Stunnel & Dropbear:**
    The Stunnel and Dropbear features require `stunnel4` and `dropbear` to be installed on the server. You can install them on Debian-based systems with:
    ```bash
    sudo apt-get update
    sudo apt-get install stunnel4 dropbear
    ```

6.  **Configure `sudo` access (Production):**
    For the application to manage system users and Stunnel, the user running the Node.js process needs passwordless `sudo` access for several commands. Create a file `/etc/sudoers.d/ultimate-vps` and add the following lines, replacing `your-node-user` with the actual user running the application:
    ```
    your-node-user ALL=(ALL) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /bin/systemctl, /usr/bin/openssl, /bin/tee, /usr/bin/sed
    ```

## Usage

-   **Run in development mode (with hot-reloading):**
    ```bash
    npm run dev
    ```
-   **Build for production:**
    ```bash
    npm run build
    ```
-   **Start the production server:**
    ```bash
    npm run start
    ```

After starting the server, navigate to `http://localhost:3000` in your browser. The first step is to register an admin user via the API.

## API Documentation

All API endpoints are prefixed with `/api`.

### Authentication (`/auth`)

| Method | Endpoint              | Description                                                              | Authentication |
| :----- | :-------------------- | :----------------------------------------------------------------------- | :------------- |
| `POST` | `/register-admin`     | Creates the first and only admin user. Intended for initial setup.       | None           |
| `POST` | `/login`              | Authenticates a user and returns a JWT.                                  | None           |

### SSH Account Management (`/ssh`)

**Note:** All SSH routes require a valid JWT.

| Method    | Endpoint                | Description                                        | Authentication |
| :-------- | :---------------------- | :------------------------------------------------- | :------------- |
| `GET`     | `/accounts`             | Retrieves a list of all SSH accounts.              | Required       |
| `POST`    | `/create`               | Creates a new SSH account.                         | Required       |
| `PATCH`   | `/toggle/:username`     | Toggles the active status of an account.           | Required       |
| `DELETE`  | `/delete/:username`     | Deletes an SSH account.                            | Required       |

### Server Statistics (`/stats`)

**Note:** All stats routes require a valid JWT.

| Method | Endpoint | Description                                       | Authentication |
| :----- | :------- | :------------------------------------------------ | :------------- |
| `GET`  | `/server`  | Retrieves real-time server stats (CPU, RAM, Disk). | Required       |
| `GET`  | `/ports`   | Retrieves the status of monitored network ports.  | Required       |

### Stunnel Management (`/stunnel`)

**Note:** All Stunnel routes require a valid JWT.

| Method | Endpoint  | Description                               | Authentication |
| :----- | :-------- | :---------------------------------------- | :------------- |
| `GET`  | `/status` | Gets the current status of Stunnel.       | Required       |
| `POST` | `/enable` | Enables the Stunnel service.              | Required       |
| `POST` | `/disable`| Disables the Stunnel service.             | Required       |

### Dropbear Management (`/dropbear`)

**Note:** All Dropbear routes require a valid JWT.

| Method | Endpoint  | Description                               | Authentication |
| :----- | :-------- | :---------------------------------------- | :------------- |
| `GET`  | `/status` | Gets the current status of Dropbear.      | Required       |
| `POST` | `/enable` | Enables the Dropbear service.             | Required       |
| `POST` | `/disable`| Disables the Dropbear service.            | Required       |

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

---

This project is licensed under the MIT License.
