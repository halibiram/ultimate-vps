import { FastifyInstance } from 'fastify';
import {
  enableStunnel,
  disableStunnel,
  getStunnelStatus,
} from '../controllers/stunnelController';
import { authenticate } from '../utils/auth';

/**
 * @plugin stunnelRoutes
 * A Fastify plugin that registers all routes related to Stunnel management.
 *
 * To ensure security, it applies the `authenticate` hook to all defined
 * routes, requiring users to be logged in to access these endpoints.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
export async function stunnelRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply the authentication hook to all routes in this plugin.
  // This is a clean way to protect a group of related endpoints.
  fastify.addHook('preHandler', authenticate);

  /**
   * @route GET /api/stunnel/status
   * @description Retrieves the current operational status of the Stunnel service.
   * @protected
   * @handler getStunnelStatus
   */
  fastify.get('/status', getStunnelStatus);

  /**
   * @route POST /api/stunnel/enable
   * @description Enables the Stunnel service, which may involve reconfiguring
   * other services like SSHD to avoid port conflicts.
   * @protected
   * @handler enableStunnel
   */
  fastify.post('/enable', enableStunnel);

  /**
   * @route POST /api/stunnel/disable
   * @description Disables the Stunnel service.
   * @protected
   * @handler disableStunnel
   */
  fastify.post('/disable', disableStunnel);
}
