"use strict";
/**
 * @file Main entry point for the Ultimate VPS SSH Manager server.
 * @description This file initializes and configures the Fastify server, registers all
 * plugins and routes, and starts listening for incoming HTTP requests.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const client_1 = require("@prisma/client");
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cors_1 = __importDefault(require("@fastify/cors"));
const static_1 = __importDefault(require("@fastify/static"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./routes/auth");
const ssh_1 = require("./routes/ssh");
const stats_1 = require("./routes/stats");
const stunnel_1 = require("./routes/stunnel");
const dropbear_1 = require("./routes/dropbear");
const webConsole_1 = require("./routes/webConsole");
// Instantiate the Prisma client for database access.
const prisma = new client_1.PrismaClient();
// Instantiate the Fastify server with default logging enabled.
const fastify = (0, fastify_1.default)({ logger: true });
/**
 * Initializes, configures, and starts the Fastify server.
 *
 * This asynchronous function performs the following critical steps:
 * 1. Registers essential Fastify plugins:
 *    - `@fastify/cors` for Cross-Origin Resource Sharing.
 *    - `@fastify/jwt` for JSON Web Token authentication.
 *    - `@fastify/redis` for connecting to a Redis instance.
 *    - `@fastify/static` for serving the frontend application.
 * 2. Registers all application route plugins (`auth`, `ssh`, `stats`, `stunnel`)
 *    with their respective API prefixes.
 * 3. Defines a public `/health` endpoint for simple health checks.
 * 4. Sets up a root (`/`) route to serve the `index.html` file, which is the
 *    entry point for the single-page application (SPA).
 * 5. Starts the server to listen on port 3000 on all available network interfaces.
 * 6. Implements graceful shutdown and error logging in case of a startup failure.
 *
 * @returns {Promise<void>} A promise that resolves when the server has started
 * successfully, or rejects if an error occurs during startup.
 */
async function start() {
    try {
        // Register Fastify plugins
        await fastify.register(cors_1.default, { origin: true }); // Allow all origins for simplicity
        await fastify.register(jwt_1.default, { secret: process.env.JWT_SECRET });
        // await fastify.register(redis, { url: process.env.REDIS_URL as string }); // Temporarily disabled for login test
        await fastify.register(websocket_1.default);
        // Serve the frontend static files from the 'public' directory
        await fastify.register(static_1.default, {
            root: path_1.default.join(__dirname, '../public'),
            prefix: '/',
        });
        // Register our application routes with their designated API prefixes
        await fastify.register(auth_1.authRoutes, { prefix: '/api/auth' });
        await fastify.register(ssh_1.sshRoutes, { prefix: '/api/ssh' });
        await fastify.register(stats_1.statsRoutes, { prefix: '/api/stats' });
        await fastify.register(stunnel_1.stunnelRoutes, { prefix: '/api/stunnel' });
        await fastify.register(dropbear_1.dropbearRoutes, { prefix: '/api/dropbear' });
        await fastify.register(webConsole_1.webConsoleRoutes, { prefix: '/api/web-console' });
        // A simple health check endpoint to confirm the server is running.
        fastify.get('/health', async () => {
            return { status: 'OK', timestamp: new Date().toISOString() };
        });
        // A handler to serve the main index.html for any root-level requests,
        // which is essential for single-page applications (SPAs).
        fastify.get('/', (req, reply) => {
            reply.sendFile('index.html');
        });
        // Start the server on all network interfaces
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 ULTIMATE VPS Server started on port 3000');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
// Execute the server start function.
start();
//# sourceMappingURL=server.js.map