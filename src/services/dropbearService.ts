/**
 * @file Provides an abstraction layer for managing the Dropbear SSH service.
 * @description This service class encapsulates the shell commands required to enable,
 * disable, and check the status of Dropbear.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * @class DropbearService
 * @description Manages the Dropbear service by executing shell commands. This includes
 * controlling the `dropbear` system service and its configuration.
 */
export class DropbearService {
    private dropbearDefaultPath = '/etc/default/dropbear';

    /**
     * Enables the Dropbear service on a specific port.
     *
     * This method performs several actions:
     * 1. It modifies the Dropbear configuration to enable it (`NO_START=0`).
     * 2. It sets the port for Dropbear to listen on.
     * 3. It starts or restarts the Dropbear service to apply the changes.
     *
     * @param {number} port - The port for Dropbear to listen on.
     * @returns {Promise<boolean>} A promise that resolves to `true` if Dropbear was
     * enabled successfully, and `false` otherwise.
     */
    async enableDropbear(port: number): Promise<boolean> {
        try {
            // Enable Dropbear by setting NO_START=0
            await execAsync(`sudo sed -i 's/NO_START=1/NO_START=0/' ${this.dropbearDefaultPath}`);
            // Set the port for Dropbear
            await execAsync(`sudo sed -i 's/^DROPBEAR_PORT=.*/DROPBEAR_PORT=${port}/' ${this.dropbearDefaultPath}`);
            // Restart Dropbear to apply changes
            await execAsync('sudo systemctl restart dropbear');
            console.log(`Dropbear enabled successfully on port ${port}`);
            return true;
        } catch (error) {
            console.error(`Failed to enable Dropbear on port ${port}:`, error);
            return false;
        }
    }

    /**
     * Disables the Dropbear service.
     *
     * This method stops the `dropbear` system service and disables it from starting on boot.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if Dropbear was
     * disabled successfully, and `false` otherwise.
     */
    async disableDropbear(): Promise<boolean> {
        try {
            // Disable Dropbear by setting NO_START=1
            await execAsync(`sudo sed -i 's/NO_START=0/NO_START=1/' ${this.dropbearDefaultPath}`);
            // Stop the Dropbear service
            await execAsync('sudo systemctl stop dropbear');
            console.log('Dropbear disabled successfully.');
            return true;
        } catch (error) {
            console.error('Failed to disable Dropbear:', error);
            return false;
        }
    }

    /**
     * Checks if the Dropbear service is currently active and running.
     * Uses `systemctl is-active` to determine the service status.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the service
     * is active, and `false` otherwise.
     */
    async isDropbearActive(): Promise<boolean> {
        try {
            const { stdout } = await execAsync('systemctl is-active dropbear');
            return stdout.trim() === 'active';
        } catch (error) {
            // The command returns a non-zero exit code if the service is not active.
            return false;
        }
    }
}
