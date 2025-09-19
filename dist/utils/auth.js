"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
/**
 * A Fastify hook to verify the JWT token on incoming requests.
 * It's used to protect routes that require authentication.
 */
async function authenticate(request, reply) {
    try {
        // This method is added by the @fastify/jwt plugin.
        // It automatically reads the token from the Authorization header,
        // verifies it, and decorates the request object with the decoded payload.
        await request.jwtVerify();
    }
    catch (err) {
        // If verification fails, send an unauthorized error.
        reply.code(401).send(err);
    }
}
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map