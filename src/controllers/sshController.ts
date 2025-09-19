/**
 * @file Manages the business logic for all SSH account operations.
 * @description This controller orchestrates the creation, retrieval, modification, and deletion
 * of SSH accounts by coordinating between the database (Prisma) and the underlying
 * operating system commands (via `SSHService`).
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, SSHAccount } from '@prisma/client';
import { SSHService } from '../services/sshService';

const prisma = new PrismaClient();
const sshService = new SSHService();

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
export async function getSshAccounts(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  try {
    const accounts = await prisma.sSHAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Enrich each account with the number of active connections.
    const enrichedAccounts = await Promise.all(
      accounts.map(async (account: SSHAccount) => {
        const activeConnections = await sshService.getUserConnections(account.username);
        return { ...account, activeConnections };
      })
    );

    return reply.send(enrichedAccounts);
  } catch (error) {
    console.error('Failed to get SSH accounts:', error);
    return reply.code(500).send({ message: 'Failed to retrieve SSH accounts.' });
  }
}

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
export async function createSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const { username, password, expiryDate, maxLogin } = request.body as any;
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
        password, // Note: Storing plain password. In a real app, hash or encrypt this.
        expiryDate: new Date(expiryDate),
        maxLogin: Number(maxLogin) || 1,
        userId: adminUser.id,
      },
    });

    return reply.code(201).send(newAccount);
  } catch (error: any) {
    console.error(`Failed to create SSH account ${username}:`, error);

    // If database insert fails after user was created, try to roll back the user creation.
    await sshService.deleteSSHUser(username);

    if (error.code === 'P2002') { // Prisma unique constraint violation
      return reply.code(409).send({ message: 'SSH account with that username already exists.' });
    }
    return reply.code(500).send({ message: 'Failed to create SSH account. The operation was rolled back.' });
  }
}

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
export async function toggleSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { username } = request.params as any;
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
    } catch (error) {
        console.error(`Failed to toggle SSH account ${username}:`, error);
        return reply.code(500).send({ message: 'Failed to toggle SSH account.' });
    }
}

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
export async function deleteSshAccount(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const { username } = request.params as any;
    try {
        // Step 1: Delete from the database first. If this fails, no harm is done to the OS.
        await prisma.sSHAccount.delete({ where: { username }});

        // Step 2: If database deletion is successful, delete the system user.
        const userDeleted = await sshService.deleteSSHUser(username);
        if (!userDeleted) {
            // Log this critical issue, but the request is still successful from the client's perspective.
            console.error(`CRITICAL: Failed to delete system user ${username}, but the database entry was removed.`);
        }

        return reply.code(204).send(); // 204 No Content is standard for successful deletions.
    } catch (error: any) {
        console.error(`Failed to delete SSH account ${username}:`, error);
        if (error.code === 'P2025') { // Prisma code for "record to delete does not exist"
            return reply.code(404).send({ message: 'Account not found.' });
        }
        return reply.code(500).send({ message: 'Failed to delete SSH account.' });
    }
}
