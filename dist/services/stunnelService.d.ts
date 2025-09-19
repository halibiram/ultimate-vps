/**
 * @class StunnelService
 *
 * A service class for managing the Stunnel service, which is used to wrap
 * SSH connections in SSL/TLS. This is useful for bypassing firewalls that
 * might block standard SSH ports.
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
    enableStunnel(port: number): Promise<boolean>;
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
    disableStunnel(port: number, restoreSshd: boolean): Promise<boolean>;
    /**
     * Checks if the Stunnel service is currently active and running.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the service
     * is active, and `false` otherwise.
     */
    isStunnelActive(): Promise<boolean>;
    /**
     * Modifies the SSH server's configuration file (`sshd_config`) to either add
     * or remove a `Port` directive. It restarts the SSH service to apply the change.
     *
     * @private
     * @param {number} port - The port number to add or remove.
     * @param {boolean} listen - If `true`, the `Port` directive is added. If `false`, it's removed.
     * @returns {Promise<void>}
     */
    private updateSshdConfig;
}
//# sourceMappingURL=stunnelService.d.ts.map