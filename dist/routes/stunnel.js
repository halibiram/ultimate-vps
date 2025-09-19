"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stunnelRoutes = void 0;
const stunnelController_1 = require("../controllers/stunnelController");
const auth_1 = require("../utils/auth");
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
async function stunnelRoutes(fastify) {
    // Apply the authentication hook to all routes in this plugin.
    // This is a clean way to protect a group of related endpoints.
    fastify.addHook('preHandler', auth_1.authenticate);
    /**
     * @route GET /api/stunnel/status
     * @description Retrieves the current operational status of the Stunnel service.
     * @protected
     * @handler getStunnelStatus
     */
    fastify.get('/status', stunnelController_1.getStunnelStatus);
    /**
     * @route POST /api/stunnel/enable
     * @description Enables the Stunnel service, which may involve reconfiguring
     * other services like SSHD to avoid port conflicts.
     * @protected
     * @handler enableStunnel
     */
    fastify.post('/enable', stunnelController_1.enableStunnel);
    /**
     * @route POST /api/stunnel/disable
     * @description Disables the Stunnel service.
     * @protected
     * @handler disableStunnel
     */
    fastify.post('/disable', stunnelController_1.disableStunnel);
}
exports.stunnelRoutes = stunnelRoutes;
//# sourceMappingURL=stunnel.js.map