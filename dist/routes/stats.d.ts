/**
 * @file Defines and registers API routes for fetching server statistics.
 * @description This file creates a Fastify plugin that groups all statistics-related
 * endpoints. All routes are protected by the `authenticate` hook.
 */
import { FastifyInstance } from 'fastify';
/**
 * Encapsulates and registers the server statistics routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can access server and port statistics.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @param {object} options - Plugin options, not used here.
 * @param {Function} done - Callback to signal completion of plugin registration.
 */
export declare function statsRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=stats.d.ts.map