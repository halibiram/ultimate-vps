"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const authController_1 = require("../controllers/authController");
/**
 * Defines the authentication routes for the application.
 * @param fastify The Fastify instance.
 */
async function authRoutes(fastify) {
    // POST /api/auth/register-admin
    // This route should only be used once for the initial setup of the admin user.
    fastify.post('/register-admin', authController_1.registerAdmin);
    // POST /api/auth/login
    // Handles user login and token generation.
    fastify.post('/login', async (request, reply) => {
        // The login controller handles validation.
        // On success, it returns the user object. On failure, it sends a reply.
        const user = await (0, authController_1.login)(request, reply);
        // If the controller has already sent a reply (e.g., on error), we stop here.
        if (reply.sent) {
            return;
        }
        // If we have a user object, it means login was successful.
        if (user) {
            // Create the JWT payload.
            const payload = {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin,
            };
            // Sign the token. It will be valid for 7 days.
            const token = fastify.jwt.sign({ payload }, { expiresIn: '7d' });
            // Send the token back to the client.
            return reply.send({ token });
        }
    });
}
exports.authRoutes = authRoutes;
//# sourceMappingURL=auth.js.map