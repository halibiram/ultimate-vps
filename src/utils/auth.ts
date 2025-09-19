import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * A Fastify hook to verify the JWT token on incoming requests.
 * It's used to protect routes that require authentication.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // This method is added by the @fastify/jwt plugin.
    // It automatically reads the token from the Authorization header,
    // verifies it, and decorates the request object with the decoded payload.
    await request.jwtVerify();
  } catch (err) {
    // If verification fails, send an unauthorized error.
    reply.code(401).send(err);
  }
}
