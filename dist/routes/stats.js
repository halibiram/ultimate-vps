"use strict";
/**
 * @file Defines and registers API routes for fetching server statistics.
 * @description This file creates a Fastify plugin that groups all statistics-related
 * endpoints. All routes are protected by the `authenticate` hook.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../utils/auth");
/**
 * Encapsulates and registers the server statistics routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can access server and port statistics.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @param {object} options - Plugin options, not used here.
 * @param {Function} done - Callback to signal completion of plugin registration.
 */
async function statsRoutes(fastify) {
    // Protect all routes in this file with the authentication hook.
    fastify.addHook('preHandler', auth_1.authenticate);
    /**
     * @route GET /api/stats/server
     * @description Retrieves real-time server statistics, including CPU, RAM, and disk usage.
     * @handler getServerStats
     */
    fastify.get('/server', statsController_1.getServerStats);
    /**
     * @route GET /api/stats/ports
     * @description Retrieves the status of monitored network ports, including the number
     * of active connections for each.
     * @handler getPortStatus
     */
    fastify.get('/ports', statsController_1.getPortStatus);
}
exports.statsRoutes = statsRoutes;
//# sourceMappingURL=stats.js.map