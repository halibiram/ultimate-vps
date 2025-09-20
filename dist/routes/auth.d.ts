/**
 * @file Defines and registers authentication-related API routes.
 * @description This file creates a Fastify plugin that encapsulates the endpoints
 * for administrator registration and user login.
 */
import { FastifyInstance } from 'fastify';
/**
 * Encapsulates and registers the authentication routes.
 * This Fastify plugin is responsible for setting up the `/register-admin` and `/login` endpoints.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance to which the routes will be registered.
 * @param {object} options - Plugin options, not used in this plugin.
 * @param {Function} done - A function to call when the plugin registration is complete.
 */
export declare function authRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=auth.d.ts.map