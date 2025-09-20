"use strict";
/**
 * @file Defines and registers the routes for fetching server statistics.
 *
 * This file creates a Fastify plugin for all statistics-related endpoints.
 * All routes defined here are protected by the `authenticate` hook, ensuring
 * that only authenticated users can access them.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../utils/auth");
/**
 * A Fastify plugin that registers routes for fetching server statistics.
 *
 * It applies the `authenticate` hook to all routes within this plugin,
 * protecting them from unauthorized access.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
async function statsRoutes(fastify) {
    // Protect all routes in this file with the authentication hook.
    fastify.addHook('preHandler', auth_1.authenticate);
    /**
     * @route GET /api/stats/server
     * @description Returns real-time server stats like CPU, RAM, and Disk usage.
     * @protected
     * @handler getServerStats
     */
    fastify.get('/server', statsController_1.getServerStats);
    /**
     * @route GET /api/stats/ports
     * @description Returns the number of active connections on monitored network ports.
     * @protected
     * @handler getPortStatus
     */
    fastify.get('/ports', statsController_1.getPortStatus);
}
exports.statsRoutes = statsRoutes;
//# sourceMappingURL=stats.js.map