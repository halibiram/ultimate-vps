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
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=auth.d.ts.map