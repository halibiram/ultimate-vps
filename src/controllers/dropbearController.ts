/**
 * @file Manages the business logic for the Dropbear service.
 * @description This controller handles enabling, disabling, and checking the status of Dropbear.
 * It uses the `DropbearService` to interact with the underlying system service.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { DropbearService } from '../services/dropbearService';

const dropbearService = new DropbearService();
const DROPBEAR_PORT = 2222; // A common alternative port for SSH.

/**
 * Enables the Dropbear service on a predefined port.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export async function enableDropbear(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const success = await dropbearService.enableDropbear(DROPBEAR_PORT);
        if (success) {
            return reply.send({ message: `Dropbear enabled successfully on port ${DROPBEAR_PORT}.` });
        } else {
            return reply.code(500).send({ message: 'Failed to enable Dropbear.' });
        }
    } catch (error) {
        console.error('Error enabling Dropbear:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while enabling Dropbear.' });
    }
}

/**
 * Disables the Dropbear service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export async function disableDropbear(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const success = await dropbearService.disableDropbear();
        if (success) {
            return reply.send({ message: 'Dropbear disabled successfully.' });
        } else {
            return reply.code(500).send({ message: 'Failed to disable Dropbear.' });
        }
    } catch (error) {
        console.error('Error disabling Dropbear:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while disabling Dropbear.' });
    }
}

/**
 * Retrieves the current operational status of the Dropbear service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply with the active status.
 */
export async function getDropbearStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const isActive = await dropbearService.isDropbearActive();
        return reply.send({ isActive });
    } catch (error) {
        console.error('Error getting Dropbear status:', error);
        return reply.code(500).send({ message: 'Failed to get Dropbear status.' });
    }
}
