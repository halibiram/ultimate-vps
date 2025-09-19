/**
 * @file Manages authentication-related logic, including admin registration and user login.
 *
 * @important
 * This file creates a single, shared instance of the Prisma Client to be used
 * by all controller functions. This is a best practice for database connection management.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
export async function registerAdmin(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const { username, email, password } = request.body as any;

  if (!username || !email || !password) {
    return reply.code(400).send({ message: 'Username, email, and password are required.' });
  }

  try {
    // Prevent creation of more than one admin user.
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount > 0) {
      return reply.code(403).send({ message: 'An admin user already exists. Registration is locked.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isAdmin: true, // First user is always an admin
      },
    });

    // Don't return the password hash in the response
    const { password: _, ...newUser } = user;
    return reply.code(201).send({ message: 'Admin user created successfully.', user: newUser });
  } catch (error: any) {
    console.error("Registration failed:", error);
    // Prisma unique constraint violation code
    if (error.code === 'P2002') {
      return reply.code(409).send({ message: 'Username or email already exists.' });
    }
    return reply.code(500).send({ message: 'An error occurred during registration.' });
  }
}

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
export async function login(request: FastifyRequest, reply: FastifyReply): Promise<Omit<User, 'password'> | FastifyReply> {
  const { username, password } = request.body as any;

  if (!username || !password) {
    return reply.code(400).send({ message: 'Username and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return reply.code(401).send({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return reply.code(401).send({ message: 'Invalid credentials.' });
    }

    // The controller's job is to validate and fetch the user.
    // The route handler will sign the JWT.
    // We return the user object without the password hash.
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;

  } catch (error)
  {
    console.error("Login failed:", error);
    return reply.code(500).send({ message: 'An error occurred during login.' });
  }
}
