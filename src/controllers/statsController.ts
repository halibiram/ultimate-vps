import { FastifyRequest, FastifyReply } from 'fastify';
import { SSHService } from '../services/sshService';

const sshService = new SSHService();

/**
 * Handles requests for real-time server statistics (CPU, RAM, Disk).
 */
export async function getServerStats(request: FastifyRequest, reply: FastifyReply) {
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
 * Handles requests for the status of monitored ports.
 */
export async function getPortStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const portInfo = await sshService.getActiveConnections();
    return reply.send(portInfo);
  } catch (error) {
    console.error('Failed to get port status:', error);
    return reply.code(500).send({ message: 'An error occurred while fetching port status.' });
  }
}
