import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * A Fastify hook to verify the JWT token on incoming requests.
 * It's used to protect routes that require authentication.
 */
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=auth.d.ts.map