/**
 * @file Provides an abstraction layer for managing the Dropbear SSH service.
 * @description This service class encapsulates the shell commands required to enable,
 * disable, and check the status of Dropbear.
 */
/**
 * @class DropbearService
 * @description Manages the Dropbear service by executing shell commands. This includes
 * controlling the `dropbear` system service and its configuration.
 */
export declare class DropbearService {
    private dropbearDefaultPath;
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
    enableDropbear(port: number): Promise<boolean>;
    /**
     * Disables the Dropbear service.
     *
     * This method stops the `dropbear` system service and disables it from starting on boot.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if Dropbear was
     * disabled successfully, and `false` otherwise.
     */
    disableDropbear(): Promise<boolean>;
    /**
     * Checks if the Dropbear service is currently active and running.
     * Uses `systemctl is-active` to determine the service status.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the service
     * is active, and `false` otherwise.
     */
    isDropbearActive(): Promise<boolean>;
}
//# sourceMappingURL=dropbearService.d.ts.map