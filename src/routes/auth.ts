/**
 * @file Defines and registers the authentication-related routes for the application.
 *
 * This file creates a Fastify plugin that encapsulates the routes for admin
 * registration and user login.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerAdmin, login } from '../controllers/authController';
import { User } from '@prisma/client';

/**
 * A Fastify plugin that registers authentication routes.
 * It includes an endpoint for initial admin registration and an endpoint for user login.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 * @returns {Promise<void>}
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * @route POST /api/auth/register-admin
   * @description Registers the first and only administrator account.
   * This endpoint is intended for initial setup and should be protected or disabled afterward.
   * @handler registerAdmin
   */
  fastify.post('/register-admin', registerAdmin);

  /**
   * @route POST /api/auth/login
   * @description Handles user login. On successful authentication, it returns a JWT.
   * @handler In-line function
   */
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    // The `login` controller function handles credential validation.
    // It returns the user object on success or sends an error reply on failure.
    const user = await login(request, reply);

    // If the controller has already sent a reply (e.g., due to an error),
    // we should not proceed further.
    if (reply.sent) {
      return;
    }

    // If the user object is returned, login was successful.
    if (user) {
      // The user object returned from the controller is of type `Omit<User, 'password'>`.
      const validUser = user as Omit<User, 'password'>;

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
