/**
 * @file Defines and registers the routes for SSH account management.
 *
 * This file creates a Fastify plugin that groups all SSH-related endpoints.
 * All routes defined here are protected by the `authenticate` hook, ensuring
 * that only authenticated users can access them.
 */
import { FastifyInstance } from 'fastify';
/**
 * A Fastify plugin that registers routes for managing SSH accounts.
 *
 * It applies the `authenticate` hook to all routes within this plugin,
 * effectively protecting them from unauthorized access.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
export declare function sshRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=ssh.d.ts.map