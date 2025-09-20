"use strict";
/**
 * @file Defines and registers authentication-related API routes.
 * @description This file creates a Fastify plugin that encapsulates the endpoints
 * for administrator registration and user login.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const authController_1 = require("../controllers/authController");
/**
 * Encapsulates and registers the authentication routes.
 * This Fastify plugin is responsible for setting up the `/register-admin` and `/login` endpoints.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance to which the routes will be registered.
 * @param {object} options - Plugin options, not used in this plugin.
 * @param {Function} done - A function to call when the plugin registration is complete.
 */
async function authRoutes(fastify) {
    /**
     * @route POST /api/auth/register-admin
     * @description Registers the first and only administrator account for the application.
     * This endpoint is intended for one-time initial setup and should be secured or
     * disabled after the first admin is created. It delegates the core logic to the
     * `registerAdmin` controller.
     */
    fastify.post('/register-admin', authController_1.registerAdmin);
    /**
     * @route POST /api/auth/login
     * @description Authenticates a user and provides a JSON Web Token (JWT) upon success.
     * It first calls the `login` controller to validate credentials. If the validation
     * is successful, it generates a JWT containing the user's ID, username, and admin status,
     * and sends it to the client.
     */
    fastify.post('/login', async (request, reply) => {
        // The `login` controller handles credential validation.
        // It returns the user object on success or sends an error reply on failure.
        const user = await (0, authController_1.login)(request, reply);
        // If the controller has already sent a reply (e.g., due to an error),
        // we should not proceed further.
        if (reply.sent) {
            return;
        }
        // If the user object is returned, login was successful.
        if (user) {
            // The user object returned from the controller is of type `Omit<User, 'password'>`.
            const validUser = user;
            // Create the payload for the JWT.
            const payload = {
                id: validUser.id,
                username: validUser.username,
                isAdmin: validUser.isAdmin,
            };
            // Sign the token with the user payload, set to expire in 7 days.
            const token = fastify.jwt.sign({ payload }, { expiresIn: '7d' });
            // Send the token back to the client.
            return reply.send({ token });
        }
    });
}
exports.authRoutes = authRoutes;
//# sourceMappingURL=auth.js.map