/**
 * @file Defines and registers API routes for Stunnel management.
 * @description This file creates a Fastify plugin for controlling the Stunnel service.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */

import { FastifyInstance } from 'fastify';
import {
  enableStunnel,
  disableStunnel,
  getStunnelStatus,
} from '../controllers/stunnelController';
import { authenticate } from '../utils/auth';

/**
 * Encapsulates and registers the Stunnel management routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can manage the Stunnel service.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @param {object} options - Plugin options, not used here.
 * @param {Function} done - Callback to signal completion of plugin registration.
 */
export async function stunnelRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply the authentication hook to all routes in this plugin.
  // This is a clean way to protect a group of related endpoints.
  fastify.addHook('preHandler', authenticate);

  /**
   * @route GET /api/stunnel/status
   * @description Retrieves the current operational status of the Stunnel service (active/inactive).
   * @handler getStunnelStatus
   */
  fastify.get('/status', getStunnelStatus);

  /**
   * @route POST /api/stunnel/enable
   * @description Enables and starts the Stunnel service.
   * @handler enableStunnel
   */
  fastify.post('/enable', enableStunnel);

  /**
   * @route POST /api/stunnel/disable
   * @description Disables and stops the Stunnel service.
   * @handler disableStunnel
   */
  fastify.post('/disable', disableStunnel);
}
