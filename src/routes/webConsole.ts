import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { handleWebConsoleConnection } from '../controllers/webConsoleController';
import { authenticate } from '../utils/auth';

/**
 * Encapsulates the routes for the Web Console feature.
 * This plugin defines the WebSocket endpoint for the interactive terminal.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 */
export async function webConsoleRoutes(fastify: FastifyInstance) {

    fastify.route({
        method: 'GET',
        url: '/', // This will be prefixed with /api/web-console
        preHandler: [authenticate],
        // This handler is for non-WebSocket requests, which we don't expect.
        handler: (request, reply) => {
            reply.code(400).send({ error: 'WebSocket connection expected.' });
        },
        // This handler is for WebSocket connections.
        wsHandler: (connection, request) => {
            // The `authenticate` preHandler has already run on the upgrade request
            // and attached the user payload to `request.user`.
            handleWebConsoleConnection(connection, request);
        }
    });
}
