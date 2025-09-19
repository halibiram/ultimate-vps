# Ultimate VPS SSH Manager

A web-based application to manage users and their SSH accounts on a Virtual Private Server (VPS). It provides a simple interface to create, update, and monitor SSH accounts and server statistics.

## 🚀 Features

- **User Management:** Create, update, and manage users.
- **SSH Account Management:** Manage SSH accounts for users, including setting expiry dates and login limits.
- **Server Monitoring:** View real-time server statistics like CPU, RAM, and disk usage.
- **Web-based UI:** A simple and intuitive web interface for managing the server.
- **Built with Modern Tech:** Powered by Fastify, Prisma, and TypeScript.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)

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
    - Create a `.env` file in the root of the project.
    - Add your PostgreSQL connection string to the `.env` file:
      ```
      DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
      ```
4.  **Run database migrations:**
    ```bash
    npm run migrate:dev
    ```

## Usage

-   **Run in development mode:**
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

## Database

This project uses [Prisma](https://www.prisma.io/) as the ORM. The database schema is defined in `prisma/schema.prisma`.

To create a new migration, run:
```bash
npx prisma migrate dev --name <migration_name>
```

## License

This project is licensed under the MIT License.
