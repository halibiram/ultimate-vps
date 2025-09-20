"use strict";
/**
 * @file Provides an abstraction layer for interacting with the server's operating system.
 * @description This service class encapsulates shell commands for managing SSH users,
 * checking server stats, and monitoring network connections. It simplifies interactions
 * with the OS for the controllers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * @class SSHService
 * @description Manages SSH users and server resources by executing shell commands.
 * This class contains all methods that interact directly with the underlying
 * operating system to perform administrative tasks.
 *
 * @important The methods in this class require `sudo` privileges to run system
 * commands like `useradd`, `userdel`, and `usermod`. The user running the Node.js
 * application must have passwordless `sudo` access for these specific commands.
 */
class SSHService {
    /**
     * Creates a new system user with a specified password.
     * Executes `useradd` to create the user and `chpasswd` to set the password.
     *
     * @param {string} username - The username for the new system user.
     * @param {string} password - The password for the new system user.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the user was
     * created successfully, and `false` otherwise.
     */
    async createSSHUser(username, password) {
        try {
            // Create system user with a home directory and bash as the default shell.
            await execAsync(`sudo useradd -m -s /bin/bash ${username}`);
            // Set the user's password.
            await execAsync(`echo '${username}:${password}' | sudo chpasswd`);
            return true;
        }
        catch (error) {
            console.error(`SSH user creation failed for ${username}:`, error);
            return false;
        }
    }
    /**
     * Deletes a system user and their home directory.
     * Executes `userdel -r` to remove the user and their associated files.
     *
     * @param {string} username - The username of the system user to delete.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the user was
     * deleted successfully, and `false` otherwise.
     */
    async deleteSSHUser(username) {
        try {
            // The -r flag removes the user's home directory and mail spool.
            await execAsync(`sudo userdel -r ${username}`);
            return true;
        }
        catch (error) {
            console.error(`SSH user deletion failed for ${username}:`, error);
            return false;
        }
    }
    /**
     * Locks or unlocks a system user's account.
     * Executes `usermod -L` to lock or `usermod -U` to unlock the account.
     *
     * @param {string} username - The username of the system user to lock or unlock.
     * @param {boolean} lock - If `true`, the user account will be locked. If `false`,
     * it will be unlocked.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the operation
     * was successful, and `false` otherwise.
     */
    async toggleUserLock(username, lock) {
        const command = lock ? `sudo usermod -L ${username}` : `sudo usermod -U ${username}`;
        try {
            await execAsync(command);
            console.log(`User ${username} ${lock ? 'locked' : 'unlocked'}.`);
            return true;
        }
        catch (error) {
            console.error(`SSH user ${lock ? 'lock' : 'unlock'} failed for ${username}:`, error);
            return false;
        }
    }
    /**
     * Counts the number of active terminal sessions for a specific user.
     * Uses the `who` command to list logged-in users and filters by the specified username.
     *
     * @param {string} username - The username to check for active connections.
     * @returns {Promise<number>} A promise that resolves to the number of active
     * connections. Returns 0 if an error occurs or no connections are found.
     */
    async getUserConnections(username) {
        try {
            const { stdout } = await execAsync(`who | grep "^${username} " | wc -l`);
            return parseInt(stdout.trim()) || 0;
        }
        catch (error) {
            // An error (e.g., if 'who' returns nothing) should be treated as 0 connections.
            return 0;
        }
    }
    /**
     * Retrieves the number of active connections on commonly monitored network ports.
     * Uses the `ss` command to count connections for ports 22, 80, 443, and 444.
     *
     * @returns {Promise<Array<{service: string; port: number; connections: number}>>} A promise
     * that resolves to an array of objects, where each object represents a monitored service
     * and its active connection count. Returns an empty array on failure.
     */
    async getActiveConnections() {
        try {
            const { stdout: port22 } = await execAsync(`ss -tn 'sport = :22' | wc -l`);
            const { stdout: port80 } = await execAsync(`ss -tn 'sport = :80' | wc -l`);
            const { stdout: port443 } = await execAsync(`ss -tn 'sport = :443' | wc -l`);
            const { stdout: port444 } = await execAsync(`ss -tn 'sport = :444' | wc -l`);
            return [
                { service: 'SSH-22', port: 22, connections: parseInt(port22.trim()) - 1 },
                { service: 'Dropbear-80', port: 80, connections: parseInt(port80.trim()) - 1 },
                { service: 'Dropbear-443', port: 443, connections: parseInt(port443.trim()) - 1 },
                { service: 'SSH-444', port: 444, connections: parseInt(port444.trim()) - 1 }
            ].map(s => ({ ...s, connections: Math.max(0, s.connections) })); // Ensure connections are not negative
        }
        catch (error) {
            console.error('Failed to get active connections:', error);
            return [];
        }
    }
    /**
     * Gathers real-time server statistics including CPU, RAM, and disk usage.
     * Executes a series of shell commands (`top`, `free`, `df`) to collect system metrics.
     *
     * @returns {Promise<{cpu: number; ram: number; disk: number; network: string; timestamp: Date} | null>}
     * A promise that resolves to an object containing the server stats. Returns `null` if any
     * of the commands fail.
     */
    async getServerStats() {
        try {
            // CPU Usage: Calculated from 'top' command output.
            const { stdout: cpuRaw } = await execAsync(`top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}'`);
            const cpuUsage = parseFloat(cpuRaw) || 0;
            // RAM Usage: Calculated from 'free' command output.
            const { stdout: ramRaw } = await execAsync(`free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}'`);
            const ramUsage = parseFloat(ramRaw) || 0;
            // Disk Usage: Parsed from 'df' command output for the root directory.
            const { stdout: diskRaw } = await execAsync(`df -h / | awk 'NR==2 {print $5}' | sed 's/%//'`);
            const diskUsage = parseFloat(diskRaw) || 0;
            // Network Stats: Fetches raw byte counts for the primary network interface.
            const { stdout: networkRaw } = await execAsync(`cat /proc/net/dev | grep -E "(eth0|ens|enp)" | head -n1 | awk '{print "RX: " $2 " bytes, TX: " $10 " bytes"}'`);
            return {
                cpu: cpuUsage,
                ram: ramUsage,
                disk: diskUsage,
                network: networkRaw.trim() || 'N/A',
                timestamp: new Date()
            };
        }
        catch (error) {
            console.error('Failed to get server stats:', error);
            return null;
        }
    }
}
exports.SSHService = SSHService;
//# sourceMappingURL=sshService.js.map