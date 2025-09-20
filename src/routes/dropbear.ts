/**
 * @file Defines and registers API routes for Dropbear management.
 * @description This file creates a Fastify plugin for controlling the Dropbear service.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */

import { FastifyInstance } from 'fastify';
import {
  enableDropbear,
  disableDropbear,
  getDropbearStatus,
} from '../controllers/dropbearController';
import { authenticate } from '../utils/auth';

/**
 * Encapsulates and registers the Dropbear management routes.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 */
export async function dropbearRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply the authentication hook to all routes in this plugin.
  fastify.addHook('preHandler', authenticate);

  /**
   * @route GET /api/dropbear/status
   * @description Retrieves the current operational status of the Dropbear service.
   * @handler getDropbearStatus
   */
  fastify.get('/status', getDropbearStatus);

  /**
   * @route POST /api/dropbear/enable
   * @description Enables and starts the Dropbear service.
   * @handler enableDropbear
   */
  fastify.post('/enable', enableDropbear);

  /**
   * @route POST /api/dropbear/disable
   * @description Disables and stops the Dropbear service.
   * @handler disableDropbear
   */
  fastify.post('/disable', disableDropbear);
}
