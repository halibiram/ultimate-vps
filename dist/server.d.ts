/**
 * @file This is the main entry point for the Ultimate VPS SSH Manager server.
 *
 * It initializes a Fastify server and configures it with all the necessary
 * plugins, routes, and error handling. This file is responsible for starting
 * the server and listening for incoming requests.
 */
/**
 * Extends the FastifyJWT interface to include a custom `user` payload.
 * This provides type safety for the decoded JWT payload throughout the application.
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
export {};
//# sourceMappingURL=server.d.ts.map