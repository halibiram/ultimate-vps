"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortStatus = exports.getServerStats = void 0;
const sshService_1 = require("../services/sshService");
const sshService = new sshService_1.SSHService();
/**
 * Handles requests for real-time server statistics (CPU, RAM, Disk).
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
 * Handles requests for the status of monitored ports.
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