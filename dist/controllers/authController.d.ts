/**
 * @file Manages authentication-related business logic.
 * @description This file contains the controllers for handling user registration and login.
 * It uses a shared Prisma Client instance to interact with the database.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '@prisma/client';
/**
 * Registers the first and only administrator for the application.
 * This function is designed to be called only once for initial setup. It checks
 * if an admin already exists and rejects the request if so. The user's password
 * is securely hashed before being stored in the database.
 *
 * @param {FastifyRequest<{ Body: Pick<User, 'username' | 'email' | 'password'> }>} request The Fastify request object, containing the new admin's credentials in the request body.
 * @param {string} request.body.username - The desired username for the admin.
 * @param {string} request.body.email - The desired email for the admin.
 * @param {string} request.body.password - The desired password for the admin.
 * @param {FastifyReply} reply The Fastify reply object, used to send responses to the client.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply. On success, it returns a 201 status with the new user object (excluding the password). On failure, it returns an appropriate error status (e.g., 400, 403, 409, 500).
 */
export declare function registerAdmin(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Authenticates a user by validating their credentials.
 * This function finds a user by their username and compares the provided password
 * with the securely stored hash. If the credentials are valid, it returns the user
s
 * object (without the password hash) to the route handler, which is then responsible
 * for generating and sending a JWT.
 *
 * @param {FastifyRequest<{ Body: Pick<User, 'username' | 'password'> }>} request The Fastify request object, containing the user's login credentials.
 * @param {string} request.body.username - The username of the user attempting to log in.
 * @param {string} request.body.password - The password of the user.
 * @param {FastifyReply} reply The Fastify reply object, used for sending error responses.
 * @returns {Promise<Omit<User, 'password'> | FastifyReply>} A promise that resolves to the user object (without the password) on successful authentication, or to a Fastify reply object on failure (e.g., 400, 401, 500).
 */
export declare function login(request: FastifyRequest, reply: FastifyReply): Promise<Omit<User, 'password'> | FastifyReply>;
//# sourceMappingURL=authController.d.ts.map