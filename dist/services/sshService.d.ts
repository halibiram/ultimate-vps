/**
 * @class SSHService
 *
 * A service class for managing SSH users and server resources by executing
 * shell commands. This class encapsulates all interactions with the underlying
 * operating system.
 *
 * @important
 * The methods in this class require `sudo` privileges to run system commands
 * like `useradd`, `userdel`, and `usermod`. The user running the Node.js
 * application must have passwordless `sudo` access for these specific commands.
 */
export declare class SSHService {
    /**
     * Creates a new system user with a specified password.
     *
     * @param {string} username - The username for the new system user.
     * @param {string} password - The password for the new system user.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the user was
     * created successfully, and `false` otherwise.
     */
    createSSHUser(username: string, password: string): Promise<boolean>;
    /**
     * Deletes a system user and their home directory.
     *
     * @param {string} username - The username of the system user to delete.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the user was
     * deleted successfully, and `false` otherwise.
     */
    deleteSSHUser(username: string): Promise<boolean>;
    /**
     * Locks or unlocks a system user's account.
     *
     * @param {string} username - The username of the system user to lock or unlock.
     * @param {boolean} lock - If `true`, the user account will be locked. If `false`,
     * it will be unlocked.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the operation
     * was successful, and `false` otherwise.
     */
    toggleUserLock(username: string, lock: boolean): Promise<boolean>;
    /**
     * Counts the number of active terminal connections for a specific user.
     *
     * @param {string} username - The username to check for active connections.
     * @returns {Promise<number>} A promise that resolves to the number of active
     * connections for the user. Returns 0 if there are no connections or an error occurs.
     */
    getUserConnections(username: string): Promise<number>;
    /**
     * Retrieves the number of active connections on commonly monitored ports.
     *
     * @returns {Promise<object[]>} A promise that resolves to an array of objects,
     * where each object represents a service and contains its name, port number,
     * and the number of active connections. Returns an empty array on failure.
     */
    getActiveConnections(): Promise<any[]>;
    /**
     * Gathers real-time server statistics including CPU, RAM, and disk usage.
     *
     * @returns {Promise<object | null>} A promise that resolves to an object containing
     * the server stats (cpu, ram, disk, network, timestamp). Returns `null` on failure.
     */
    getServerStats(): Promise<any>;
}
//# sourceMappingURL=sshService.d.ts.map