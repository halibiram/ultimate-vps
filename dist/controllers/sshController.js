"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSshAccount = exports.toggleSshAccount = exports.createSshAccount = exports.getSshAccounts = void 0;
const client_1 = require("@prisma/client");
const sshService_1 = require("../services/sshService");
const prisma = new client_1.PrismaClient();
const sshService = new sshService_1.SSHService();
/**
 * Retrieves all SSH accounts from the database and enriches them with live connection data.
 */
async function getSshAccounts(request, reply) {
    try {
        const accounts = await prisma.sSHAccount.findMany({
            orderBy: { createdAt: 'desc' },
        });
        // Enrich each account with the number of active connections
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
 * Creates a new SSH account (both system user and database record).
 */
async function createSshAccount(request, reply) {
    const { username, password, expiryDate, maxLogin } = request.body;
    const adminUser = request.user; // Decoded from JWT
    if (!username || !password || !expiryDate) {
        return reply.code(400).send({ message: 'Username, password, and expiry date are required.' });
    }
    try {
        // Step 1: Create the system user via the SSHService
        const userCreated = await sshService.createSSHUser(username, password);
        if (!userCreated) {
            // If the OS user can't be created, don't proceed.
            throw new Error('Failed to create system user.');
        }
        // Step 2: If system user is created, create the database record
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
 * Toggles the active status of an SSH account (and locks/unlocks the system user).
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
 * Deletes an SSH account (from the database and the system).
 */
async function deleteSshAccount(request, reply) {
    const { username } = request.params;
    try {
        // Step 1: Delete from the database first. If this fails, no harm is done to the OS.
        await prisma.sSHAccount.delete({ where: { username } });
        // Step 2: If database deletion is successful, delete the system user.
        const userDeleted = await sshService.deleteSSHUser(username);
        if (!userDeleted) {
            // Log this issue, but the request is still successful from the client's perspective.
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