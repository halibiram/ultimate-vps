/**
 * @file Manages the business logic for the Dropbear service.
 * @description This controller handles enabling, disabling, and checking the status of Dropbear.
 * It uses the `DropbearService` to interact with the underlying system service.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Enables the Dropbear service on a predefined port.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export declare function enableDropbear(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Disables the Dropbear service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export declare function disableDropbear(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Retrieves the current operational status of the Dropbear service.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply with the active status.
 */
export declare function getDropbearStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
//# sourceMappingURL=dropbearController.d.ts.map