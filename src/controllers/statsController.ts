/**
 * @file Manages the logic for retrieving server and network statistics.
 *
 * This controller provides endpoints for fetching real-time server health data.
 * It uses an instance of the `SSHService` to execute the underlying system commands
 * required to gather this information.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { SSHService } from '../services/sshService';

const sshService = new SSHService();

/**
 * Handles requests for real-time server statistics (CPU, RAM, Disk).
 *
 * This function calls the `sshService` to get the current server stats and
 * sends them back to the client.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply, containing
 * the server statistics object on success.
 */
export async function getServerStats(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  try {
    const stats = await sshService.getServerStats();
    if (!stats) {
      return reply.code(500).send({ message: 'Could not retrieve server stats.' });
    }
    return reply.send(stats);
  } catch (error) {
    console.error('Failed to get server stats:', error);
    return reply.code(500).send({ message: 'An error occurred while fetching server stats.' });
  }
}

/**
 * Handles requests for the connection status of monitored ports.
 *
 * This function calls the `sshService` to get the number of active connections
 * for a predefined list of network ports and sends the data to the client.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply, containing
 * an array of port status objects on success.
 */
export async function getPortStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  try {
    const portInfo = await sshService.getActiveConnections();
    return reply.send(portInfo);
  } catch (error) {
    console.error('Failed to get port status:', error);
    return reply.code(500).send({ message: 'An error occurred while fetching port status.' });
  }
}
