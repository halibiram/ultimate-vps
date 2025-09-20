/**
 * @file Manages the business logic for the V2Ray service.
 * @description This controller handles installing, uninstalling, enabling, disabling,
 * and checking the status of V2Ray (xray-ui). It uses the `V2RayService`
 * to interact with the underlying system service.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { V2RayService } from '../services/v2rayService';

const v2rayService = new V2RayService();

/**
 * Retrieves the current operational status of the V2Ray service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export async function getV2RayStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const status = await v2rayService.getStatus();
        return reply.send({ status });
    } catch (error) {
        console.error('Error getting V2Ray status:', error);
        return reply.code(500).send({ message: 'Failed to get V2Ray status.' });
    }
}

/**
 * Installs the V2Ray (xray-ui) service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export async function installV2Ray(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const success = await v2rayService.install();
        if (success) {
            return reply.send({ message: 'V2Ray (xray-ui) installed successfully.' });
        } else {
            return reply.code(500).send({ message: 'Failed to install V2Ray.' });
        }
    } catch (error) {
        console.error('Error installing V2Ray:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while installing V2Ray.' });
    }
}

/**
 * Uninstalls the V2Ray (xray-ui) service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export async function uninstallV2Ray(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const success = await v2rayService.uninstall();
        if (success) {
            return reply.send({ message: 'V2Ray (xray-ui) uninstalled successfully.' });
        } else {
            return reply.code(500).send({ message: 'Failed to uninstall V2Ray.' });
        }
    } catch (error) {
        console.error('Error uninstalling V2Ray:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while uninstalling V2Ray.' });
    }
}

/**
 * Enables the V2Ray (xray-ui) service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export async function enableV2Ray(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const success = await v2rayService.enable();
        if (success) {
            return reply.send({ message: 'V2Ray service enabled successfully.' });
        } else {
            return reply.code(500).send({ message: 'Failed to enable V2Ray service.' });
        }
    } catch (error) {
        console.error('Error enabling V2Ray service:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while enabling the V2Ray service.' });
    }
}

/**
 * Disables the V2Ray (xray-ui) service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export async function disableV2Ray(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
        const success = await v2rayService.disable();
        if (success) {
            return reply.send({ message: 'V2Ray service disabled successfully.' });
        } else {
            return reply.code(500).send({ message: 'Failed to disable V2Ray service.' });
        }
    } catch (error) {
        console.error('Error disabling V2Ray service:', error);
        return reply.code(500).send({ message: 'An unexpected error occurred while disabling the V2Ray service.' });
    }
}
