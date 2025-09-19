import { FastifyInstance } from 'fastify';
import { getServerStats, getPortStatus } from '../controllers/statsController';
import { authenticate } from '../utils/auth';

/**
 * Defines the routes for fetching server statistics.
 * All routes are protected and require authentication.
 * @param fastify The Fastify instance.
 */
export async function statsRoutes(fastify: FastifyInstance) {
  // Protect all routes in this file with the authentication hook.
  fastify.addHook('preHandler', authenticate);

  // GET /api/stats/server
  // Returns server stats like CPU, RAM, and Disk usage.
  fastify.get('/server', getServerStats);

  // GET /api/stats/ports
  // Returns the number of active connections on monitored ports.
  fastify.get('/ports', getPortStatus);
}
