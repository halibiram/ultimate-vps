/**
 * @file Defines and registers API routes for fetching server statistics.
 * @description This file creates a Fastify plugin that groups all statistics-related
 * endpoints. All routes are protected by the `authenticate` hook.
 */

import { FastifyInstance } from 'fastify';
import { getServerStats, getPortStatus } from '../controllers/statsController';
import { authenticate } from '../utils/auth';

/**
 * Encapsulates and registers the server statistics routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can access server and port statistics.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @param {object} options - Plugin options, not used here.
 * @param {Function} done - Callback to signal completion of plugin registration.
 */
export async function statsRoutes(fastify: FastifyInstance): Promise<void> {
  // Protect all routes in this file with the authentication hook.
  fastify.addHook('preHandler', authenticate);

  /**
   * @route GET /api/stats/server
   * @description Retrieves real-time server statistics, including CPU, RAM, and disk usage.
   * @handler getServerStats
   */
  fastify.get('/server', getServerStats);

  /**
   * @route GET /api/stats/ports
   * @description Retrieves the status of monitored network ports, including the number
   * of active connections for each.
   * @handler getPortStatus
   */
  fastify.get('/ports', getPortStatus);
}
