import Fastify, { FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import jwt from '@fastify/jwt';
import redis from '@fastify/redis';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import path from 'path';

import { authRoutes } from './routes/auth';
import { sshRoutes } from './routes/ssh';
import { statsRoutes } from './routes/stats';

// Extend FastifyRequest to include the user payload from JWT
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      payload: {
        id: number;
        username: string;
        isAdmin: boolean;
      }
    };
  }
}

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

async function start() {
  try {
    // Register Fastify plugins
    await fastify.register(cors, { origin: true }); // Allow all origins
    await fastify.register(jwt, { secret: process.env.JWT_SECRET as string });
    await fastify.register(redis, { url: process.env.REDIS_URL as string });

    // Serve the frontend static files from the 'public' directory
    await fastify.register(staticPlugin, {
      root: path.join(__dirname, '../public'),
      prefix: '/',
    });

    // Register our application routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(sshRoutes, { prefix: '/api/ssh' });
    await fastify.register(statsRoutes, { prefix: '/api/stats' });

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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
