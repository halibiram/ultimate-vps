/**
 * @file Manages the business logic for SSH account operations.
 *
 * This controller handles creating, retrieving, updating, and deleting SSH accounts.
 * It orchestrates interactions between the database (via Prisma) and the underlying
 * operating system (via `SSHService`). It also instantiates and shares a single
 * instance of the Prisma Client and the SSHService for use in its functions.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Retrieves all SSH accounts from the database and enriches them with live data.
 *
 * This function fetches all SSH account records and, for each account, it calls
 * the `SSHService` to get the number of active system connections for that user.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply containing
 * an array of SSH account objects, each enriched with an `activeConnections` count.
 */
export declare function getSshAccounts(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Creates a new SSH account, which includes creating a system user and a database record.
 *
 * It follows a two-step process:
 * 1. Create the system user using `SSHService`.
 * 2. If successful, create a corresponding record in the database.
 * If the database insertion fails, it attempts to roll back by deleting the created system user.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {object} request.body - The request body.
 * @param {string} request.body.username - The username for the new SSH account.
 * @param {string} request.body.password - The password for the new account.
 * @param {string} request.body.expiryDate - The expiration date for the account (ISO 8601 format).
 * @param {number} [request.body.maxLogin=1] - The maximum number of simultaneous logins.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply, containing
 * the newly created SSH account object on success.
 */
export declare function createSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Toggles the active status of an SSH account.
 *
 * This function finds an SSH account by its username, determines the new status
 * (active -> inactive, or inactive -> active), and then updates both the system
 * user (by locking or unlocking the account) and the database record.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {object} request.params - The URL parameters.
 * @param {string} request.params.username - The username of the account to toggle.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply, containing
 * the updated SSH account object on success.
 */
export declare function toggleSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Deletes an SSH account from both the database and the operating system.
 *
 * It first deletes the account from the database. If successful, it proceeds
 * to delete the corresponding system user. This order ensures that if the system
 * user deletion fails, we don't have an orphaned database record.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {object} request.params - The URL parameters.
 * @param {string} request.params.username - The username of the account to delete.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success,
 * it sends a 204 No Content response.
 */
export declare function deleteSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
//# sourceMappingURL=sshController.d.ts.map