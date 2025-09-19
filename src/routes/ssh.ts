/**
 * @file Defines and registers the routes for SSH account management.
 *
 * This file creates a Fastify plugin that groups all SSH-related endpoints.
 * All routes defined here are protected by the `authenticate` hook, ensuring
 * that only authenticated users can access them.
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
 * A Fastify plugin that registers routes for managing SSH accounts.
 *
 * It applies the `authenticate` hook to all routes within this plugin,
 * effectively protecting them from unauthorized access.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
export async function sshRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply the authentication hook to every route defined in this plugin.
  // This is a clean and efficient way to protect a group of related endpoints.
  fastify.addHook('preHandler', authenticate);

  /**
   * @route GET /api/ssh/accounts
   * @description Retrieves a list of all SSH accounts.
   * @protected
   * @handler getSshAccounts
   */
  fastify.get('/accounts', getSshAccounts);

  /**
   * @route POST /api/ssh/create
   * @description Creates a new SSH account.
   * @protected
   * @handler createSshAccount
   */
  fastify.post('/create', createSshAccount);

  /**
   * @route PATCH /api/ssh/toggle/:username
   * @description Toggles the active status of an SSH account (locks/unlocks the system user).
   * @protected
   * @param {string} username - The username of the account to toggle.
   * @handler toggleSshAccount
   */
  fastify.patch('/toggle/:username', toggleSshAccount);

  /**
   * @route DELETE /api/ssh/delete/:username
   * @description Deletes an SSH account from the database and the system.
   * @protected
   * @param {string} username - The username of the account to delete.
   * @handler deleteSshAccount
   */
  fastify.delete('/delete/:username', deleteSshAccount);
}
