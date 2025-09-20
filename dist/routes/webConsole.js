"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webConsoleRoutes = void 0;
const webConsoleController_1 = require("../controllers/webConsoleController");
const auth_1 = require("../utils/auth");
/**
 * Encapsulates the routes for the Web Console feature.
 * This plugin defines the WebSocket endpoint for the interactive terminal.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance.
 */
async function webConsoleRoutes(fastify) {
    fastify.route({
        method: 'GET',
        url: '/',
        preHandler: [auth_1.authenticate],
        // This handler is for non-WebSocket requests, which we don't expect.
        handler: (request, reply) => {
            reply.code(400).send({ error: 'WebSocket connection expected.' });
        },
        // This handler is for WebSocket connections.
        wsHandler: (connection, request) => {
            // The `authenticate` preHandler has already run on the upgrade request
            // and attached the user payload to `request.user`.
            (0, webConsoleController_1.handleWebConsoleConnection)(connection, request);
        }
    });
}
exports.webConsoleRoutes = webConsoleRoutes;
//# sourceMappingURL=webConsole.js.map