/**
 * @file Manages authentication-related logic, including admin registration and user login.
 *
 * @important
 * This file creates a single, shared instance of the Prisma Client to be used
 * by all controller functions. This is a best practice for database connection management.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '@prisma/client';
/**
 * Handles the registration of the first and only admin user.
 *
 * This function is designed for initial application setup. It checks if an admin
 * user already exists and prevents the creation of more than one. It hashes the
 * provided password before storing the new user in the database.
 *
 * @param {FastifyRequest} request - The Fastify request object, containing the request body.
 * @param {object} request.body - The request body.
 * @param {string} request.body.username - The desired username for the admin.
 * @param {string} request.body.email - The desired email for the admin.
 * @param {string} request.body.password - The desired password for the admin.
 * @param {FastifyReply} reply - The Fastify reply object, used to send a response.
 * @returns {Promise<FastifyReply>} A promise that resolves to the Fastify reply.
 */
export declare function registerAdmin(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply>;
/**
 * Handles user login by validating credentials.
 *
 * It finds a user by their username and compares the provided password with the
 * stored hash. On successful validation, it returns the user object (without the
 * password hash) to the calling route handler, which is then responsible for
 * signing and issuing a JWT.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {object} request.body - The request body.
 * @param {string} request.body.username - The user's username.
 * @param {string} request.body.password - The user's password.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<Omit<User, 'password'> | FastifyReply>} A promise that resolves to the user
 * object without the password if login is successful, or to a Fastify reply on failure.
 */
export declare function login(request: FastifyRequest, reply: FastifyReply): Promise<Omit<User, 'password'> | FastifyReply>;
//# sourceMappingURL=authController.d.ts.map