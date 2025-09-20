/**
 * @file Defines and registers API routes for V2Ray management.
 * @description This file creates a Fastify plugin for controlling the V2Ray service.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */

import { FastifyInstance } from 'fastify';
import {
    getV2RayStatus,
    installV2Ray,
    uninstallV2Ray,
    enableV2Ray,
    disableV2Ray,
} from '../controllers/v2rayController';
import { authenticate } from '../utils/auth';

/**
 * Encapsulates and registers the V2Ray management routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can manage the V2Ray service.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 */
export async function v2rayRoutes(fastify: FastifyInstance): Promise<void> {
    // Apply the authentication hook to all routes in this plugin.
    fastify.addHook('preHandler', authenticate);

    /**
     * @route GET /api/v2ray/status
     * @description Retrieves the current operational status of the V2Ray service.
     * @handler getV2RayStatus
     */
    fastify.get('/status', getV2RayStatus);

    /**
     * @route POST /api/v2ray/install
     * @description Installs the V2Ray service.
     * @handler installV2Ray
     */
    fastify.post('/install', installV2Ray);

    /**
     * @route POST /api/v2ray/uninstall
     * @description Uninstalls the V2Ray service.
     * @handler uninstallV2Ray
     */
    fastify.post('/uninstall', uninstallV2Ray);

    /**
     * @route POST /api/v2ray/enable
     * @description Enables and starts the V2Ray service.
     * @handler enableV2Ray
     */
    fastify.post('/enable', enableV2Ray);

    /**
     * @route POST /api/v2ray/disable
     * @description Disables and stops the V2Ray service.
     * @handler disableV2Ray
     */
    fastify.post('/disable', disableV2Ray);
}
