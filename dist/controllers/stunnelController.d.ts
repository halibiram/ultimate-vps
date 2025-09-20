import { FastifyRequest, FastifyReply } from 'fastify';
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
export declare function enableStunnel(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
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
export declare function disableStunnel(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
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
export declare function getStunnelStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
//# sourceMappingURL=stunnelController.d.ts.map