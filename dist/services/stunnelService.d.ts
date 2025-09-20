/**
 * @file Provides an abstraction layer for managing the Stunnel service.
 * @description This service class encapsulates the shell commands required to enable,
 * disable, and check the status of Stunnel, which provides an SSL/TLS wrapper for
 * other services like SSH.
 */
/**
 * @class StunnelService
 * @description Manages the Stunnel service by executing shell commands. This includes
 * generating certificates, creating configuration files, and controlling the
 * `stunnel4` system service.
 */
export declare class StunnelService {
    private stunnelConfigPath;
    private stunnelDefaultFilePath;
    private sshdConfigPath;
    /**
     * Enables and configures Stunnel to listen on a specific port and forward
     * traffic to the local SSH server (port 22).
     *
     * This method performs several critical actions:
     * 1. It ensures the SSH server is not listening on the target port to prevent conflicts.
     * 2. It generates a new self-signed SSL certificate for Stunnel.
     * 3. It creates the Stunnel configuration file (`/etc/stunnel/stunnel.conf`).
     * 4. It enables the Stunnel daemon to start on boot (`/etc/default/stunnel4`).
     * 5. It starts or restarts the Stunnel service to apply the changes.
     *
     * @param {number} port - The external port for Stunnel to listen on (e.g., 443).
     * @returns {Promise<boolean>} A promise that resolves to `true` if Stunnel was
     * enabled successfully, and `false` otherwise.
     */
    enableStunnel(port: number): Promise<boolean>;
    /**
     * Disables the Stunnel service.
     * This method stops the `stunnel4` system service. It can optionally restore the
     * SSH server's configuration to listen on the port that Stunnel was previously using.
     *
     * @param {number} port - The port that Stunnel was configured to use.
     * @param {boolean} restoreSshd - If `true`, the SSH server will be reconfigured
     * to listen on the specified port after Stunnel is disabled.
     * @returns {Promise<boolean>} A promise that resolves to `true` if Stunnel was
     * disabled successfully, and `false` otherwise.
     */
    disableStunnel(port: number, restoreSshd: boolean): Promise<boolean>;
    /**
     * Checks if the Stunnel service is currently active and running.
     * Uses `systemctl is-active` to determine the service status.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the service
     * is active, and `false` otherwise (including if the service is inactive, failed,
     * or not found).
     */
    isStunnelActive(): Promise<boolean>;
    /**
     * Modifies the SSH server's configuration file (`sshd_config`) to either add
     * or remove a `Port` directive, then restarts the SSH service.
     *
     * @private
     * @param {number} port - The port number to add or remove from the `sshd_config`.
     * @param {boolean} listen - If `true`, the `Port ${port}` directive is added. If `false`, it is removed.
     * @returns {Promise<void>} A promise that resolves once the operation is complete.
     */
    private updateSshdConfig;
}
//# sourceMappingURL=stunnelService.d.ts.map