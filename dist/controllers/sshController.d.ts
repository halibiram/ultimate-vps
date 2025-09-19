import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Retrieves all SSH accounts from the database and enriches them with live connection data.
 */
export declare function getSshAccounts(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Creates a new SSH account (both system user and database record).
 */
export declare function createSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Toggles the active status of an SSH account (and locks/unlocks the system user).
 */
export declare function toggleSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Deletes an SSH account (from the database and the system).
 */
export declare function deleteSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=sshController.d.ts.map