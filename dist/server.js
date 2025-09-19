"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const client_1 = require("@prisma/client");
const jwt_1 = __importDefault(require("@fastify/jwt"));
const redis_1 = __importDefault(require("@fastify/redis"));
const cors_1 = __importDefault(require("@fastify/cors"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./routes/auth");
const ssh_1 = require("./routes/ssh");
const stats_1 = require("./routes/stats");
const prisma = new client_1.PrismaClient();
const fastify = (0, fastify_1.default)({ logger: true });
async function start() {
    try {
        // Register Fastify plugins
        await fastify.register(cors_1.default, { origin: true }); // Allow all origins
        await fastify.register(jwt_1.default, { secret: process.env.JWT_SECRET });
        await fastify.register(redis_1.default, { url: process.env.REDIS_URL });
        // Serve the frontend static files from the 'public' directory
        await fastify.register(static_1.default, {
            root: path_1.default.join(__dirname, '../public'),
            prefix: '/',
        });
        // Register our application routes
        await fastify.register(auth_1.authRoutes, { prefix: '/api/auth' });
        await fastify.register(ssh_1.sshRoutes, { prefix: '/api/ssh' });
        await fastify.register(stats_1.statsRoutes, { prefix: '/api/stats' });
        // Health check endpoint
        fastify.get('/health', async () => {
            return { status: 'OK', timestamp: new Date().toISOString() };
        });
        // Set a handler to serve index.html for the root route,
        // which is necessary for single-page applications (SPAs).
        fastify.get('/', (req, reply) => {
            reply.sendFile('index.html');
        });
        // Start the server
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 ULTIMATE VPS Server started on port 3000');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map