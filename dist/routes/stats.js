"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../utils/auth");
/**
 * Defines the routes for fetching server statistics.
 * All routes are protected and require authentication.
 * @param fastify The Fastify instance.
 */
async function statsRoutes(fastify) {
    // Protect all routes in this file with the authentication hook.
    fastify.addHook('preHandler', auth_1.authenticate);
    // GET /api/stats/server
    // Returns server stats like CPU, RAM, and Disk usage.
    fastify.get('/server', statsController_1.getServerStats);
    // GET /api/stats/ports
    // Returns the number of active connections on monitored ports.
    fastify.get('/ports', statsController_1.getPortStatus);
}
exports.statsRoutes = statsRoutes;
//# sourceMappingURL=stats.js.map