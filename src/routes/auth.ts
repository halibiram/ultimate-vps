import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerAdmin, login } from '../controllers/authController';

/**
 * Defines the authentication routes for the application.
 * @param fastify The Fastify instance.
 */
export async function authRoutes(fastify: FastifyInstance) {

  // POST /api/auth/register-admin
  // This route should only be used once for the initial setup of the admin user.
  fastify.post('/register-admin', registerAdmin);

  // POST /api/auth/login
  // Handles user login and token generation.
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    // The login controller handles validation.
    // On success, it returns the user object. On failure, it sends a reply.
    const user = await login(request, reply);

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
