"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStunnelStatus = exports.disableStunnel = exports.enableStunnel = void 0;
const stunnelService_1 = require("../services/stunnelService");
const stunnelService = new stunnelService_1.StunnelService();
const STUNNEL_PORT = 443; // The default port for Stunnel, can be made configurable later.
/**
 * @controller enableStunnel
 * Handles the API request to enable the Stunnel service.
 *
 * It calls the `StunnelService` to configure and start Stunnel on a predefined port.
 * This provides a simple, one-click way to activate the SSH-over-SSL tunnel.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply,
 * indicating success or failure.
 */
async function enableStunnel(request, reply) {
    try {
        const success = await stunnelService.enableStunnel(STUNNEL_PORT);
        if (success) {
            return reply.send({ message: `Stunnel enabled successfully on port ${STUNNEL_PORT}.` });
        }
        else {
            return reply.code(500).send({ message: 'Failed to enable Stunnel.' });
        }
    }
    catch (error) {
        console.error('Error enabling Stunnel:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while enabling Stunnel.' });
    }
}
exports.enableStunnel = enableStunnel;
/**
 * @controller disableStunnel
 * Handles the API request to disable the Stunnel service.
 *
 * It calls the `StunnelService` to stop the Stunnel process. As a safety measure,
 * it does not automatically re-enable the SSH daemon on the port that Stunnel was using.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply,
 * indicating success or failure.
 */
async function disableStunnel(request, reply) {
    try {
        const success = await stunnelService.disableStunnel(STUNNEL_PORT, false);
        if (success) {
            return reply.send({ message: 'Stunnel disabled successfully.' });
        }
        else {
            return reply.code(500).send({ message: 'Failed to disable Stunnel.' });
        }
    }
    catch (error) {
        console.error('Error disabling Stunnel:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while disabling Stunnel.' });
    }
}
exports.disableStunnel = disableStunnel;
/**
 * @controller getStunnelStatus
 * Handles the API request to retrieve the current status of the Stunnel service.
 *
 * This function is essential for the frontend to determine whether to show
 * "Enable" or "Disable" controls to the user.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply,
 * containing an `isActive` boolean property.
 */
async function getStunnelStatus(request, reply) {
    try {
        const isActive = await stunnelService.isStunnelActive();
        return reply.send({ isActive });
    }
    catch (error) {
        console.error('Error getting Stunnel status:', error);
        return reply.code(500).send({ message: 'Failed to get Stunnel status.' });
    }
}
exports.getStunnelStatus = getStunnelStatus;
//# sourceMappingURL=stunnelController.js.map