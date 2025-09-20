/**
 * @file Manages the business logic for the Stunnel service.
 * @description This controller handles enabling, disabling, and checking the status of Stunnel,
 * which provides an SSL wrapper for SSH connections. It uses the `StunnelService`
 * to interact with the underlying system service.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Enables the Stunnel service on a predefined port.
 * This function calls the `StunnelService` to configure and start the Stunnel
 * process, creating an SSH-over-SSL tunnel.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with a success message. On failure, it returns a 500 status.
 */
export declare function enableStunnel(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Disables the Stunnel service.
 * This function calls the `StunnelService` to stop the Stunnel process. It does
 * not automatically restore the original SSH daemon configuration as a safety measure.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with a success message. On failure, it returns a 500 status.
 */
export declare function disableStunnel(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Retrieves the current operational status of the Stunnel service.
 * This function is used by the frontend to display whether Stunnel is currently
 * active or inactive.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with an object containing an `isActive` boolean property. On failure, it returns a 500 status.
 */
export declare function getStunnelStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
//# sourceMappingURL=stunnelController.d.ts.map