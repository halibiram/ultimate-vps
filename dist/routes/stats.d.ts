/**
 * @file Defines and registers the routes for fetching server statistics.
 *
 * This file creates a Fastify plugin for all statistics-related endpoints.
 * All routes defined here are protected by the `authenticate` hook, ensuring
 * that only authenticated users can access them.
 */
import { FastifyInstance } from 'fastify';
/**
 * A Fastify plugin that registers routes for fetching server statistics.
 *
 * It applies the `authenticate` hook to all routes within this plugin,
 * protecting them from unauthorized access.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
export declare function statsRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=stats.d.ts.map