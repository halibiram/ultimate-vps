/**
 * @file Provides an abstraction layer for interacting with the server's operating system.
 * @description This service class encapsulates shell commands for managing SSH users,
 * checking server stats, and monitoring network connections. It simplifies interactions
 * with the OS for the controllers.
 */
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
export declare class SSHService {
    /**
     * Creates a new system user with a specified password.
     * Executes `useradd` to create the user and `chpasswd` to set the password.
     *
     * @param {string} username - The username for the new system user.
     * @param {string} password - The password for the new system user.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the user was
     * created successfully, and `false` otherwise.
     */
    createSSHUser(username: string, password: string): Promise<boolean>;
    /**
     * Deletes a system user and their home directory.
     * Executes `userdel -r` to remove the user and their associated files.
     *
     * @param {string} username - The username of the system user to delete.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the user was
     * deleted successfully, and `false` otherwise.
     */
    deleteSSHUser(username: string): Promise<boolean>;
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
    toggleUserLock(username: string, lock: boolean): Promise<boolean>;
    /**
     * Counts the number of active terminal sessions for a specific user.
     * Uses the `who` command to list logged-in users and filters by the specified username.
     *
     * @param {string} username - The username to check for active connections.
     * @returns {Promise<number>} A promise that resolves to the number of active
     * connections. Returns 0 if an error occurs or no connections are found.
     */
    getUserConnections(username: string): Promise<number>;
    /**
     * Retrieves the number of active connections on commonly monitored network ports.
     * Uses the `ss` command to count connections for ports 22, 80, 443, and 444.
     *
     * @returns {Promise<Array<{service: string; port: number; connections: number}>>} A promise
     * that resolves to an array of objects, where each object represents a monitored service
     * and its active connection count. Returns an empty array on failure.
     */
    getActiveConnections(): Promise<any[]>;
    /**
     * Gathers real-time server statistics including CPU, RAM, and disk usage.
     * Executes a series of shell commands (`top`, `free`, `df`) to collect system metrics.
     *
     * @returns {Promise<{cpu: number; ram: number; disk: number; network: string; timestamp: Date} | null>}
     * A promise that resolves to an object containing the server stats. Returns `null` if any
     * of the commands fail.
     */
    getServerStats(): Promise<any>;
}
//# sourceMappingURL=sshService.d.ts.map