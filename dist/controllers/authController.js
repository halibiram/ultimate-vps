"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.registerAdmin = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// It's better to instantiate Prisma Client once and share it across your application.
// We'll create a single instance to be imported by all controllers.
const prisma = new client_1.PrismaClient();
/**
 * Handles the registration of the FIRST and ONLY admin user.
 * This endpoint should be used for initial setup and then ideally disabled or protected.
 */
async function registerAdmin(request, reply) {
    const { username, email, password } = request.body;
    if (!username || !email || !password) {
        return reply.code(400).send({ message: 'Username, email, and password are required.' });
    }
    try {
        // Prevent creation of more than one admin user.
        const adminCount = await prisma.user.count({ where: { isAdmin: true } });
        if (adminCount > 0) {
            return reply.code(403).send({ message: 'An admin user already exists. Registration is locked.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
    }
    catch (error) {
        console.error("Registration failed:", error);
        // Prisma unique constraint violation code
        if (error.code === 'P2002') {
            return reply.code(409).send({ message: 'Username or email already exists.' });
        }
        return reply.code(500).send({ message: 'An error occurred during registration.' });
    }
}
exports.registerAdmin = registerAdmin;
/**
 * Handles user login.
 * On successful validation, it returns the user object to the route handler for JWT signing.
 */
async function login(request, reply) {
    const { username, password } = request.body;
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return reply.code(401).send({ message: 'Invalid credentials.' });
        }
        // The controller's job is to validate and fetch the user.
        // The route handler will sign the JWT.
        // We return the user object without the password hash.
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    catch (error) {
        console.error("Login failed:", error);
        return reply.code(500).send({ message: 'An error occurred during login.' });
    }
}
exports.login = login;
//# sourceMappingURL=authController.js.map