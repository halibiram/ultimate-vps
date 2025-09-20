/**
 * @file Manages the retrieval of server and network statistics.
 * @description This controller provides endpoints for fetching real-time server health
 * data, such as CPU, RAM, and disk usage, as well as network port status. It relies
 * on the `SSHService` to execute the necessary system commands.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Retrieves real-time server statistics.
 * This function calls the `SSHService` to get current CPU, RAM, and disk usage
 * and sends this data back to the client.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object, used to send the statistics.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with the server statistics object. On failure, it returns a 500 status.
 */
export declare function getServerStats(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Retrieves the connection status for a predefined list of network ports.
 * This function calls the `SSHService` to get the number of active connections
 * for monitored network ports and sends the data to the client.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object, used to send the port status data.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with an array of port status objects. On failure, it returns a 500 status.
 */
export declare function getPortStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
//# sourceMappingURL=statsController.d.ts.map