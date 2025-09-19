import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * @class StunnelService
 *
 * A service class for managing the Stunnel service, which is used to wrap
 * SSH connections in SSL/TLS. This is useful for bypassing firewalls that
 * might block standard SSH ports.
 */
export class StunnelService {
    private stunnelConfigPath = '/etc/stunnel/stunnel.conf';
    private stunnelDefaultFilePath = '/etc/default/stunnel4';
    private sshdConfigPath = '/etc/ssh/sshd_config';

    /**
     * Enables and configures Stunnel to listen on a specific port and forward
     * traffic to the local SSH server (port 22).
     *
     * This method performs several critical actions:
     * 1. It ensures that the SSH server itself is not configured to listen on the
     *    target port, preventing a port conflict.
     * 2. It generates a new self-signed SSL certificate for Stunnel to use.
     * 3. It creates the Stunnel configuration file.
     * 4. It ensures the Stunnel daemon is enabled to start on boot.
     * 5. It starts or restarts the Stunnel service to apply the changes.
     *
     * @param {number} port - The external port for Stunnel to listen on (e.g., 443).
     * @returns {Promise<boolean>} A promise that resolves to `true` if Stunnel was
     * enabled successfully, and `false` otherwise.
     */
    async enableStunnel(port: number): Promise<boolean> {
        try {
            // Step 1: Ensure sshd is not listening on the target port to avoid conflict.
            await this.updateSshdConfig(port, false);

            // Step 2: Generate a self-signed certificate for Stunnel.
            await execAsync(
                `sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 ` +
                `-keyout /etc/stunnel/stunnel.pem -out /etc/stunnel/stunnel.pem ` +
                `-subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost"`
            );

            // Step 3: Create the Stunnel configuration file.
            const config = `
pid = /var/run/stunnel4/stunnel.pid
output = /var/log/stunnel4/stunnel.log
cert = /etc/stunnel/stunnel.pem
client = no

[ssh-ssl]
accept = ${port}
connect = 127.0.0.1:22
            `.trim();
            await execAsync(`echo '${config}' | sudo tee ${this.stunnelConfigPath}`);


            // Step 4: Ensure the Stunnel daemon is enabled.
            await execAsync(`sudo sed -i 's/ENABLED=0/ENABLED=1/' ${this.stunnelDefaultFilePath}`);

            // Step 5: Start or restart the Stunnel service.
            await execAsync('sudo systemctl restart stunnel4');

            console.log(`Stunnel enabled successfully on port ${port}`);
            return true;
        } catch (error) {
            console.error(`Failed to enable Stunnel on port ${port}:`, error);
            return false;
        }
    }

    /**
     * Disables the Stunnel service and optionally restores the SSH server's
     * configuration to listen on the port that Stunnel was using.
     *
     * @param {number} port - The port Stunnel was configured to use.
     * @param {boolean} restoreSshd - If `true`, the SSH server will be configured
     * to listen on the specified port after Stunnel is disabled.
     * @returns {Promise<boolean>} A promise that resolves to `true` if Stunnel was
     * disabled successfully, and `false` otherwise.
     */
    async disableStunnel(port: number, restoreSshd: boolean): Promise<boolean> {
        try {
            // Step 1: Stop the Stunnel service.
            await execAsync('sudo systemctl stop stunnel4');

            // Step 2: Optionally, re-enable sshd to listen on the port.
            if (restoreSshd) {
                await this.updateSshdConfig(port, true);
            }

            console.log('Stunnel disabled successfully.');
            return true;
        } catch (error) {
            console.error('Failed to disable Stunnel:', error);
            return false;
        }
    }

    /**
     * Checks if the Stunnel service is currently active and running.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the service
     * is active, and `false` otherwise.
     */
    async isStunnelActive(): Promise<boolean> {
        try {
            const { stdout } = await execAsync('systemctl is-active stunnel4');
            return stdout.trim() === 'active';
        } catch (error) {
            // The command returns a non-zero exit code if the service is not active.
            return false;
        }
    }

    /**
     * Modifies the SSH server's configuration file (`sshd_config`) to either add
     * or remove a `Port` directive. It restarts the SSH service to apply the change.
     *
     * @private
     * @param {number} port - The port number to add or remove.
     * @param {boolean} listen - If `true`, the `Port` directive is added. If `false`, it's removed.
     * @returns {Promise<void>}
     */
    private async updateSshdConfig(port: number, listen: boolean): Promise<void> {
        const config = await execAsync(`sudo cat ${this.sshdConfigPath}`);
        const portDirective = `Port ${port}`;
        const alreadyExists = new RegExp(`^\\s*${portDirective}`, 'm').test(config.stdout);

        let needsChange = false;

        if (listen && !alreadyExists) {
            // Add the port directive if it doesn't exist.
            await execAsync(`echo '${portDirective}' | sudo tee -a ${this.sshdConfigPath}`);
            needsChange = true;
        } else if (!listen && alreadyExists) {
            // Remove the port directive if it exists.
            await execAsync(`sudo sed -i '/^\\s*Port ${port}/d' ${this.sshdConfigPath}`);
            needsChange = true;
        }

        // Restart SSH only if the configuration was actually changed.
        if (needsChange) {
            await execAsync('sudo systemctl restart sshd');
            console.log(`SSHD config updated to ${listen ? 'listen on' : 'stop listening on'} port ${port}.`);
        }
    }
}
