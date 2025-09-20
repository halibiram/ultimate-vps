"use strict";
/**
 * @file Manages the business logic for SSH account operations.
 *
 * This controller handles creating, retrieving, updating, and deleting SSH accounts.
 * It orchestrates interactions between the database (via Prisma) and the underlying
 * operating system (via `SSHService`). It also instantiates and shares a single
 * instance of the Prisma Client and the SSHService for use in its functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSshAccount = exports.toggleSshAccount = exports.createSshAccount = exports.getSshAccounts = void 0;
const client_1 = require("@prisma/client");
const sshService_1 = require("../services/sshService");
const prisma = new client_1.PrismaClient();
const sshService = new sshService_1.SSHService();
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
async function getSshAccounts(request, reply) {
    try {
        const accounts = await prisma.sSHAccount.findMany({
            orderBy: { createdAt: 'desc' },
        });
        // Enrich each account with the number of active connections.
        const enrichedAccounts = await Promise.all(accounts.map(async (account) => {
            const activeConnections = await sshService.getUserConnections(account.username);
            return { ...account, activeConnections };
        }));
        return reply.send(enrichedAccounts);
    }
    catch (error) {
        console.error('Failed to get SSH accounts:', error);
        return reply.code(500).send({ message: 'Failed to retrieve SSH accounts.' });
    }
}
exports.getSshAccounts = getSshAccounts;
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
async function createSshAccount(request, reply) {
    const { username, password, expiryDate, maxLogin } = request.body;
    const adminUser = request.user; // Decoded from JWT
    if (!username || !password || !expiryDate) {
        return reply.code(400).send({ message: 'Username, password, and expiry date are required.' });
    }
    try {
        // Step 1: Create the system user via the SSHService.
        const userCreated = await sshService.createSSHUser(username, password);
        if (!userCreated) {
            throw new Error('Failed to create system user.');
        }
        // Step 2: If system user is created, create the database record.
        const newAccount = await prisma.sSHAccount.create({
            data: {
                username,
                password,
                expiryDate: new Date(expiryDate),
                maxLogin: Number(maxLogin) || 1,
                userId: adminUser.id,
            },
        });
        return reply.code(201).send(newAccount);
    }
    catch (error) {
        console.error(`Failed to create SSH account ${username}:`, error);
        // If database insert fails after user was created, try to roll back the user creation.
        await sshService.deleteSSHUser(username);
        if (error.code === 'P2002') { // Prisma unique constraint violation
            return reply.code(409).send({ message: 'SSH account with that username already exists.' });
        }
        return reply.code(500).send({ message: 'Failed to create SSH account. The operation was rolled back.' });
    }
}
exports.createSshAccount = createSshAccount;
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
async function toggleSshAccount(request, reply) {
    const { username } = request.params;
    try {
        const account = await prisma.sSHAccount.findUnique({ where: { username } });
        if (!account) {
            return reply.code(404).send({ message: 'Account not found.' });
        }
        const newStatus = !account.isActive;
        // Lock the user if they are being deactivated, unlock if being activated.
        const lockToggled = await sshService.toggleUserLock(username, !newStatus);
        if (!lockToggled) {
            return reply.code(500).send({ message: 'Failed to update system user status.' });
        }
        // If OS command is successful, update the database.
        const updatedAccount = await prisma.sSHAccount.update({
            where: { username },
            data: { isActive: newStatus },
        });
        return reply.send(updatedAccount);
    }
    catch (error) {
        console.error(`Failed to toggle SSH account ${username}:`, error);
        return reply.code(500).send({ message: 'Failed to toggle SSH account.' });
    }
}
exports.toggleSshAccount = toggleSshAccount;
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
async function deleteSshAccount(request, reply) {
    const { username } = request.params;
    try {
        // Step 1: Delete from the database first. If this fails, no harm is done to the OS.
        await prisma.sSHAccount.delete({ where: { username } });
        // Step 2: If database deletion is successful, delete the system user.
        const userDeleted = await sshService.deleteSSHUser(username);
        if (!userDeleted) {
            // Log this critical issue, but the request is still successful from the client's perspective.
            console.error(`CRITICAL: Failed to delete system user ${username}, but the database entry was removed.`);
        }
        return reply.code(204).send(); // 204 No Content is standard for successful deletions.
    }
    catch (error) {
        console.error(`Failed to delete SSH account ${username}:`, error);
        if (error.code === 'P2025') { // Prisma code for "record to delete does not exist"
            return reply.code(404).send({ message: 'Account not found.' });
        }
        return reply.code(500).send({ message: 'Failed to delete SSH account.' });
    }
}
exports.deleteSshAccount = deleteSshAccount;
//# sourceMappingURL=sshController.js.map