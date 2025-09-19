import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Handles requests for real-time server statistics (CPU, RAM, Disk).
 */
export declare function getServerStats(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Handles requests for the status of monitored ports.
 */
export declare function getPortStatus(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=statsController.d.ts.map