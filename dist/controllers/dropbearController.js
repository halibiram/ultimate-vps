"use strict";
/**
 * @file Manages the business logic for the Dropbear service.
 * @description This controller handles enabling, disabling, and checking the status of Dropbear.
 * It uses the `DropbearService` to interact with the underlying system service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDropbearStatus = exports.disableDropbear = exports.enableDropbear = void 0;
const dropbearService_1 = require("../services/dropbearService");
const dropbearService = new dropbearService_1.DropbearService();
const DROPBEAR_PORT = 2222; // A common alternative port for SSH.
/**
 * Enables the Dropbear service on a predefined port.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
async function enableDropbear(request, reply) {
    try {
        const success = await dropbearService.enableDropbear(DROPBEAR_PORT);
        if (success) {
            return reply.send({ message: `Dropbear enabled successfully on port ${DROPBEAR_PORT}.` });
        }
        else {
            return reply.code(500).send({ message: 'Failed to enable Dropbear.' });
        }
    }
    catch (error) {
        console.error('Error enabling Dropbear:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while enabling Dropbear.' });
    }
}
exports.enableDropbear = enableDropbear;
/**
 * Disables the Dropbear service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
async function disableDropbear(request, reply) {
    try {
        const success = await dropbearService.disableDropbear();
        if (success) {
            return reply.send({ message: 'Dropbear disabled successfully.' });
        }
        else {
            return reply.code(500).send({ message: 'Failed to disable Dropbear.' });
        }
    }
    catch (error) {
        console.error('Error disabling Dropbear:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while disabling Dropbear.' });
    }
}
exports.disableDropbear = disableDropbear;
/**
 * Retrieves the current operational status of the Dropbear service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply with the active status.
 */
async function getDropbearStatus(request, reply) {
    try {
        const isActive = await dropbearService.isDropbearActive();
        return reply.send({ isActive });
    }
    catch (error) {
        console.error('Error getting Dropbear status:', error);
        return reply.code(500).send({ message: 'Failed to get Dropbear status.' });
    }
}
exports.getDropbearStatus = getDropbearStatus;
//# sourceMappingURL=dropbearController.js.map