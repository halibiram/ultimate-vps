/**
 * @file Defines and registers the authentication-related routes for the application.
 *
 * This file creates a Fastify plugin that encapsulates the routes for admin
 * registration and user login.
 */
import { FastifyInstance } from 'fastify';
/**
 * A Fastify plugin that registers authentication routes.
 * It includes an endpoint for initial admin registration and an endpoint for user login.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
export declare function authRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=auth.d.ts.map