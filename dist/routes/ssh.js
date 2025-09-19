"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sshRoutes = void 0;
const sshController_1 = require("../controllers/sshController");
const auth_1 = require("../utils/auth");
/**
 * Defines the routes for SSH account management.
 * All routes in this file are protected and require admin authentication.
 * @param fastify The Fastify instance.
 */
async function sshRoutes(fastify) {
    // Apply the authentication hook to every route defined in this plugin.
    // This is a clean way to protect a group of related endpoints.
    fastify.addHook('preHandler', auth_1.authenticate);
    // GET /api/ssh/accounts
    // Retrieves a list of all SSH accounts.
    fastify.get('/accounts', sshController_1.getSshAccounts);
    // POST /api/ssh/create
    // Creates a new SSH account.
    fastify.post('/create', sshController_1.createSshAccount);
    // PATCH /api/ssh/toggle/:username
    // Toggles the active status of an account.
    fastify.patch('/toggle/:username', sshController_1.toggleSshAccount);
    // DELETE /api/ssh/delete/:username
    // Deletes an SSH account.
    fastify.delete('/delete/:username', sshController_1.deleteSshAccount);
}
exports.sshRoutes = sshRoutes;
//# sourceMappingURL=ssh.js.map