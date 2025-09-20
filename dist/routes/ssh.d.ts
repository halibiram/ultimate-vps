/**
 * @file Defines and registers API routes for SSH account management.
 * @description This file creates a Fastify plugin that groups all SSH-related endpoints.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */
import { FastifyInstance } from 'fastify';
/**
 * Encapsulates and registers the SSH account management routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can perform SSH management operations.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @param {object} options - Plugin options, not used here.
 * @param {Function} done - Callback to signal completion of plugin registration.
 */
export declare function sshRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=ssh.d.ts.map