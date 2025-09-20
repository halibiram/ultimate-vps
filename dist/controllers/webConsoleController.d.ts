import { FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
/**
 * Handles WebSocket connections for the web console.
 * It authenticates the user via a JWT token (validated by a hook before this handler),
 * spawns a pseudo-terminal (pty), and streams data between the client and the server-side shell.
 *
 * @param {WebSocket} connection - The raw WebSocket connection object.
 * @param {FastifyRequest} request - The initial Fastify request that upgraded the connection.
 */
export declare const handleWebConsoleConnection: (connection: WebSocket, request: FastifyRequest) => void;
//# sourceMappingURL=webConsoleController.d.ts.map