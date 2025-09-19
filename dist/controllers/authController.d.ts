import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Handles the registration of the FIRST and ONLY admin user.
 * This endpoint should be used for initial setup and then ideally disabled or protected.
 */
export declare function registerAdmin(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Handles user login.
 * On successful validation, it returns the user object to the route handler for JWT signing.
 */
export declare function login(request: FastifyRequest, reply: FastifyReply): Promise<{
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=authController.d.ts.map