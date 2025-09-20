/**
 * @file Manages the business logic for all SSH account operations.
 * @description This controller orchestrates the creation, retrieval, modification, and deletion
 * of SSH accounts by coordinating between the database (Prisma) and the underlying
 * operating system commands (via `SSHService`).
 */
import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Retrieves a comprehensive list of all SSH accounts.
 * This function fetches all SSH account records from the database and enriches each
 * record with the real-time number of active connections for that user, obtained
 * from the `SSHService`.
 *
 * @param {FastifyRequest} request The Fastify request object.
 * @param {FastifyReply} reply The Fastify reply object, used to send the list of accounts.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with an array of SSH account objects, each including an `activeConnections` count. On failure, it returns a 500 status.
 */
export declare function getSshAccounts(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Creates a new SSH account, including a system user and a database record.
 * This function performs a transactional operation: it first creates the system user
 * via `SSHService`. If successful, it creates a corresponding record in the database.
 * If the database operation fails, it attempts to roll back the system user creation.
 *
 * @param {FastifyRequest<{ Body: { username: string; password: string; expiryDate: string; maxLogin?: number } }>} request The Fastify request object, containing the new account details.
 * @param {string} request.body.username - The username for the new account.
 * @param {string} request.body.password - The password for the new account.
 * @param {string} request.body.expiryDate - The expiration date in ISO 8601 format.
 * @param {number} [request.body.maxLogin=1] - The maximum number of simultaneous logins allowed.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it returns a 201 status with the newly created SSH account object. On failure, it returns an appropriate error status (e.g., 400, 409, 500).
 */
export declare function createSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Toggles the active status of an SSH account (active/inactive).
 * This function updates both the system user's account status (by locking or
 * unlocking it) and the `isActive` flag in the database.
 *
 * @param {FastifyRequest<{ Params: { username: string } }>} request The Fastify request object, containing the username in the URL parameters.
 * @param {string} request.params.username - The username of the account to toggle.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 200 status with the updated SSH account object. On failure, it returns an appropriate error status (e.g., 404, 500).
 */
export declare function toggleSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Deletes an SSH account from both the system and the database.
 * This function first removes the account from the database. If that is successful,
 * it proceeds to delete the corresponding system user. This order prevents orphaned
 * database records in case the system user deletion fails.
 *
 * @param {FastifyRequest<{ Params: { username: string } }>} request The Fastify request object, containing the username to delete.
 * @param {string} request.params.username - The username of the account to be deleted.
 * @param {FastifyReply} reply The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it sends a 204 No Content response. On failure, it returns an appropriate error status (e.g., 404, 500).
 */
export declare function deleteSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
//# sourceMappingURL=sshController.d.ts.map