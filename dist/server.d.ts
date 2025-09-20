/**
 * @file Main entry point for the Ultimate VPS SSH Manager server.
 * @description This file initializes and configures the Fastify server, registers all
 * plugins and routes, and starts listening for incoming HTTP requests.
 */
import 'dotenv/config';
/**
 * Extends the FastifyJWT interface to include a custom `user` payload.
 * This provides type safety for the decoded JWT payload throughout the application,
 * making the user's identity and permissions available on the request object after
 * authentication.
 */
declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            id: number;
            username: string;
            isAdmin: boolean;
        };
    }
}
//# sourceMappingURL=server.d.ts.map