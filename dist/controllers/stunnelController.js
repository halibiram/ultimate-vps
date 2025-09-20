"use strict";
/**
 * @file Manages the business logic for the Stunnel service.
 * @description This controller handles enabling, disabling, and checking the status of Stunnel,
 * which provides an SSL wrapper for SSH connections. It uses the `StunnelService`
 * to interact with the underlying system service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStunnelStatus = exports.disableStunnel = exports.enableStunnel = void 0;
const stunnelService_1 = require("../services/stunnelService");
const stunnelService = new stunnelService_1.StunnelService();
const STUNNEL_PORT = 443; // The default port for Stunnel, can be made configurable later.
/**
 * Enables the Stunnel service on a predefined port.
 * This function calls the `StunnelService` to configure and start the Stunnel
 * process, creating an SSH-over-SSL tunnel.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with a success message. On failure, it returns a 500 status.
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
 * Disables the Stunnel service.
 * This function calls the `StunnelService` to stop the Stunnel process. It does
 * not automatically restore the original SSH daemon configuration as a safety measure.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with a success message. On failure, it returns a 500 status.
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
 * Retrieves the current operational status of the Stunnel service.
 * This function is used by the frontend to display whether Stunnel is currently
 * active or inactive.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with an object containing an `isActive` boolean property. On failure, it returns a 500 status.
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