/**
 * @file Defines and registers API routes for SSH account management.
 * @description This file creates a Fastify plugin that groups all SSH-related endpoints.
 * All routes are protected by the `authenticate` hook, requiring a valid JWT for access.
 */

import { FastifyInstance } from 'fastify';
import {
  getSshAccounts,
  createSshAccount,
  toggleSshAccount,
  deleteSshAccount,
} from '../controllers/sshController';
import { authenticate } from '../utils/auth';

/**
 * Encapsulates and registers the SSH account management routes.
 * This plugin applies the `authenticate` hook to all its routes, ensuring that
 * only authenticated users can perform SSH management operations.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @param {object} options - Plugin options, not used here.
 * @param {Function} done - Callback to signal completion of plugin registration.
 */
export async function sshRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply the authentication hook to every route defined in this plugin.
  // This is a clean and efficient way to protect a group of related endpoints.
  fastify.addHook('preHandler', authenticate);

  /**
   * @route GET /api/ssh/accounts
   * @description Retrieves a list of all SSH accounts, enriched with real-time data.
   * @handler getSshAccounts
   */
  fastify.get('/accounts', getSshAccounts);

  /**
   * @route POST /api/ssh/create
   * @description Creates a new SSH account on the system and in the database.
   * @handler createSshAccount
   */
  fastify.post('/create', createSshAccount);

  /**
   * @route PATCH /api/ssh/toggle/:username
   * @description Toggles the active status of a specific SSH account, effectively
   * locking or unlocking the system user.
   * @param {string} username - The username of the account to toggle, passed as a URL parameter.
   * @handler toggleSshAccount
   */
  fastify.patch('/toggle/:username', toggleSshAccount);

  /**
   * @route DELETE /api/ssh/delete/:username
   * @description Deletes an SSH account from the system and the database.
   * @param {string} username - The username of the account to delete, passed as a URL parameter.
   * @handler deleteSshAccount
   */
  fastify.delete('/delete/:username', deleteSshAccount);
}
