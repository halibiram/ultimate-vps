"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// NOTE: The node application will need to run these commands with sudo.
// This can be configured by allowing the node user to run specific commands
// in the /etc/sudoers file for a production environment.
class SSHService {
    async createSSHUser(username, password) {
        try {
            // Create system user
            await execAsync(`sudo useradd -m -s /bin/bash ${username}`);
            // Set password
            await execAsync(`echo '${username}:${password}' | sudo chpasswd`);
            return true;
        }
        catch (error) {
            console.error(`SSH user creation failed for ${username}:`, error);
            return false;
        }
    }
    async deleteSSHUser(username) {
        try {
            await execAsync(`sudo userdel -r ${username}`);
            return true;
        }
        catch (error) {
            console.error(`SSH user deletion failed for ${username}:`, error);
            return false;
        }
    }
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
    async getUserConnections(username) {
        try {
            const { stdout } = await execAsync(`who | grep "^${username} " | wc -l`);
            return parseInt(stdout.trim()) || 0;
        }
        catch (error) {
            // An error (e.g., if who returns nothing) should be treated as 0 connections.
            return 0;
        }
    }
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
    async getServerStats() {
        try {
            // CPU Usage
            const { stdout: cpuRaw } = await execAsync(`top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}'`);
            const cpuUsage = parseFloat(cpuRaw) || 0;
            // RAM Usage
            const { stdout: ramRaw } = await execAsync(`free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}'`);
            const ramUsage = parseFloat(ramRaw) || 0;
            // Disk Usage
            const { stdout: diskRaw } = await execAsync(`df -h / | awk 'NR==2 {print $5}' | sed 's/%//'`);
            const diskUsage = parseFloat(diskRaw) || 0;
            // Network Stats (example: bytes received and transmitted on eth0)
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