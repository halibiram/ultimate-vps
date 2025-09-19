# Ultimate VPS SSH Manager

A web-based application to manage users and their SSH accounts on a Virtual Private Server (VPS). It provides a simple, modern interface to create, update, and monitor SSH accounts and view real-time server statistics.

The application is built with a **TypeScript** backend using **Fastify** and **Prisma**, and a vanilla **JavaScript** frontend.

## 🚀 Features

- **Secure User Authentication:** JWT-based authentication system for protecting administrative actions.
- **Initial Admin Setup:** A one-time, secure endpoint for registering the primary admin user.
- **Full SSH Account Management:**
    - **Create:** Add new system users with passwords, expiry dates, and login limits.
    - **View:** See a list of all SSH accounts with their status and number of active connections.
    - **Toggle:** Activate or deactivate accounts, which locks or unlocks the system user.
    - **Delete:** Remove SSH accounts from both the database and the operating system.
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

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- `sudo` access for the user running the application, to manage system users.

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

4.  **Run database migrations:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Configure `sudo` access (Production):**
    For the application to manage system users, the user running the Node.js process needs passwordless `sudo` access for the `useradd`, `userdel`, and `usermod` commands. This can be configured by adding a file in `/etc/sudoers.d/`.

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

---

This project is licensed under the MIT License.
