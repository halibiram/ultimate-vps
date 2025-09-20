/**
 * @file Manages authentication-related business logic.
 * @description This file contains the controllers for handling user registration and login.
 * It uses a shared Prisma Client instance to interact with the database.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, User, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return reply.code(500).send({
        message: 'Database connection error. Please check server configuration.',
      });
    }
    // Prisma unique constraint violation code
    if (error.code === 'P2002') {
      return reply.code(409).send({ message: 'Username or email already exists.' });
    }
    return reply.code(500).send({ message: 'An error occurred during registration.' });
  }
}

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

  } catch (error: any) {
    console.error("Login failed:", error);
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return reply.code(500).send({
        message: 'Database connection error. Please check server configuration.',
      });
    }
    return reply.code(500).send({ message: 'An error occurred during login.' });
  }
}
