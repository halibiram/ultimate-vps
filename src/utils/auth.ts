/**
 * @file Provides authentication-related utility functions.
 * @description This file contains middleware for verifying JWTs to protect routes.
 */

import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * A Fastify hook that serves as authentication middleware.
 * This function verifies the JSON Web Token (JWT) on an incoming request. It is intended
 * to be used as a `preHandler` hook in Fastify to protect routes that require
 * authentication. It leverages the `request.jwtVerify()` method provided by the
 * `@fastify/jwt` plugin.
 *
 * @param {FastifyRequest} request The incoming Fastify request object. The hook will look
 * for a JWT in the `Authorization` header.
 * @param {FastifyReply} reply The Fastify reply object. It is used to send a 401
 * Unauthorized response if JWT verification fails.
 * @returns {Promise<void>} A promise that resolves if authentication is successful,
 * allowing the request to proceed to the route handler. If authentication fails,
 * the promise may not resolve as a reply is sent, halting the request lifecycle.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    let token: string | null = null;
    if (request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    } else if (request.query && (request.query as any).token) {
      token = (request.query as any).token;
    }

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = await request.server.jwt.verify(token);
    request.user = decoded as any; // Manually decorate the request
  } catch (err) {
    // If verification fails, send an unauthorized error.
    reply.code(401).send(err);
  }
}
