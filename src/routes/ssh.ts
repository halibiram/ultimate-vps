import { FastifyInstance } from 'fastify';
import {
  getSshAccounts,
  createSshAccount,
  toggleSshAccount,
  deleteSshAccount,
} from '../controllers/sshController';
import { authenticate } from '../utils/auth';

/**
 * Defines the routes for SSH account management.
 * All routes in this file are protected and require admin authentication.
 * @param fastify The Fastify instance.
 */
export async function sshRoutes(fastify: FastifyInstance) {
  // Apply the authentication hook to every route defined in this plugin.
  // This is a clean way to protect a group of related endpoints.
  fastify.addHook('preHandler', authenticate);

  // GET /api/ssh/accounts
  // Retrieves a list of all SSH accounts.
  fastify.get('/accounts', getSshAccounts);

  // POST /api/ssh/create
  // Creates a new SSH account.
  fastify.post('/create', createSshAccount);

  // PATCH /api/ssh/toggle/:username
  // Toggles the active status of an account.
  fastify.patch('/toggle/:username', toggleSshAccount);

  // DELETE /api/ssh/delete/:username
  // Deletes an SSH account.
  fastify.delete('/delete/:username', deleteSshAccount);
}
