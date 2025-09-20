"use strict";
/**
 * @file Defines and registers API routes for Dropbear management.
 * @description This file creates a Fastify plugin for controlling the Dropbear service.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropbearRoutes = void 0;
const dropbearController_1 = require("../controllers/dropbearController");
const auth_1 = require("../utils/auth");
/**
 * Encapsulates and registers the Dropbear management routes.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 */
async function dropbearRoutes(fastify) {
    // Apply the authentication hook to all routes in this plugin.
    fastify.addHook('preHandler', auth_1.authenticate);
    /**
     * @route GET /api/dropbear/status
     * @description Retrieves the current operational status of the Dropbear service.
     * @handler getDropbearStatus
     */
    fastify.get('/status', dropbearController_1.getDropbearStatus);
    /**
     * @route POST /api/dropbear/enable
     * @description Enables and starts the Dropbear service.
     * @handler enableDropbear
     */
    fastify.post('/enable', dropbearController_1.enableDropbear);
    /**
     * @route POST /api/dropbear/disable
     * @description Disables and stops the Dropbear service.
     * @handler disableDropbear
     */
    fastify.post('/disable', dropbearController_1.disableDropbear);
}
exports.dropbearRoutes = dropbearRoutes;
//# sourceMappingURL=dropbear.js.map