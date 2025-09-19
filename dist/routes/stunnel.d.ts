import { FastifyInstance } from 'fastify';
/**
 * @plugin stunnelRoutes
 * A Fastify plugin that registers all routes related to Stunnel management.
 *
 * To ensure security, it applies the `authenticate` hook to all defined
 * routes, requiring users to be logged in to access these endpoints.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
export declare function stunnelRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=stunnel.d.ts.map