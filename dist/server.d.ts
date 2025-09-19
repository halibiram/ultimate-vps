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