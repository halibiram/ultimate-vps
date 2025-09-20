/**
 * @file Defines and registers API routes for Dropbear management.
 * @description This file creates a Fastify plugin for controlling the Dropbear service.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */
import { FastifyInstance } from 'fastify';
/**
 * Encapsulates and registers the Dropbear management routes.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 */
export declare function dropbearRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=dropbear.d.ts.map