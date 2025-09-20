"use strict";
/**
 * @file Manages the retrieval of server and network statistics.
 * @description This controller provides endpoints for fetching real-time server health
 * data, such as CPU, RAM, and disk usage, as well as network port status. It relies
 * on the `SSHService` to execute the necessary system commands.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortStatus = exports.getServerStats = void 0;
const sshService_1 = require("../services/sshService");
const sshService = new sshService_1.SSHService();
/**
 * Retrieves real-time server statistics.
 * This function calls the `SSHService` to get current CPU, RAM, and disk usage
 * and sends this data back to the client.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object, used to send the statistics.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with the server statistics object. On failure, it returns a 500 status.
 */
async function getServerStats(request, reply) {
    try {
        const stats = await sshService.getServerStats();
        if (!stats) {
            return reply.code(500).send({ message: 'Could not retrieve server stats.' });
        }
        return reply.send(stats);
    }
    catch (error) {
        console.error('Failed to get server stats:', error);
        return reply.code(500).send({ message: 'An error occurred while fetching server stats.' });
    }
}
exports.getServerStats = getServerStats;
/**
 * Retrieves the connection status for a predefined list of network ports.
 * This function calls the `SSHService` to get the number of active connections
 * for monitored network ports and sends the data to the client.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object, used to send the port status data.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with an array of port status objects. On failure, it returns a 500 status.
 */
async function getPortStatus(request, reply) {
    try {
        const portInfo = await sshService.getActiveConnections();
        return reply.send(portInfo);
    }
    catch (error) {
        console.error('Failed to get port status:', error);
        return reply.code(500).send({ message: 'An error occurred while fetching port status.' });
    }
}
exports.getPortStatus = getPortStatus;
//# sourceMappingURL=statsController.js.map