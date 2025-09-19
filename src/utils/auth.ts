import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * A Fastify hook to verify the JWT on an incoming request. It acts as a middleware
 * to protect routes that require user authentication.
 *
 * It uses the `jwtVerify` method decorated onto the request object by the `@fastify/jwt`
 * plugin. If the JWT is valid, the request is allowed to proceed. If verification
 * fails (e.g., invalid token, expired), it sends a 401 Unauthorized response
 * and stops the request from reaching the route handler.
 *
 * @param {FastifyRequest} request - The incoming request object from Fastify.
 * @param {FastifyReply} reply - The reply object from Fastify, used to send a response.
 * @returns {Promise<void>} A promise that resolves if authentication is successful.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
