/**
 * @file Defines and registers API routes for Stunnel management.
 * @description This file creates a Fastify plugin for controlling the Stunnel service.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */
import { FastifyInstance } from 'fastify';
/**
 * Encapsulates and registers the Stunnel management routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can manage the Stunnel service.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @param {object} options - Plugin options, not used here.
 * @param {Function} done - Callback to signal completion of plugin registration.
 */
export declare function stunnelRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=stunnel.d.ts.map