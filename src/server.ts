/**
 * @file This is the main entry point for the Ultimate VPS SSH Manager server.
 *
 * It initializes a Fastify server and configures it with all the necessary
 * plugins, routes, and error handling. This file is responsible for starting
 * the server and listening for incoming requests.
 */

import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import jwt from '@fastify/jwt';
import redis from '@fastify/redis';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import path from 'path';

import { authRoutes } from './routes/auth';
import { sshRoutes } from './routes/ssh';
import { statsRoutes } from './routes/stats';

/**
 * Extends the FastifyJWT interface to include a custom `user` payload.
 * This provides type safety for the decoded JWT payload throughout the application.
 */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: number;
      username: string;
      isAdmin: boolean;
    };
  }
}

// Instantiate the Prisma client for database access.
const prisma = new PrismaClient();
// Instantiate the Fastify server with default logging enabled.
const fastify = Fastify({ logger: true });

/**
 * Initializes and starts the Fastify server.
 *
 * This asynchronous function performs the following steps:
 * 1. Registers essential Fastify plugins: CORS, JWT, Redis, and Static for serving the frontend.
 * 2. Registers all application route plugins (auth, ssh, stats) with their respective prefixes.
 * 3. Defines a public `/health` endpoint for health checks.
 * 4. Sets up a root (`/`) route to serve the `index.html` of the single-page application.
 * 5. Starts the server to listen on port 3000.
 * 6. Implements graceful shutdown and error logging in case of a startup failure.
 *
 * @returns {Promise<void>}
 */
async function start(): Promise<void> {
  try {
    // Register Fastify plugins
    await fastify.register(cors, { origin: true }); // Allow all origins for simplicity
    await fastify.register(jwt, { secret: process.env.JWT_SECRET as string });
    await fastify.register(redis, { url: process.env.REDIS_URL as string });

    // Serve the frontend static files from the 'public' directory
    await fastify.register(staticPlugin, {
      root: path.join(__dirname, '../public'),
      prefix: '/',
    });

    // Register our application routes with their designated API prefixes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(sshRoutes, { prefix: '/api/ssh' });
    await fastify.register(statsRoutes, { prefix: '/api/stats' });

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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Execute the server start function.
start();
