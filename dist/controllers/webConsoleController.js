"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebConsoleConnection = void 0;
const pty = __importStar(require("node-pty"));
const os_1 = __importDefault(require("os"));
// Determine the shell to use based on the operating system.
const shell = os_1.default.platform() === 'win32' ? 'powershell.exe' : 'bash';
/**
 * Handles WebSocket connections for the web console.
 * It authenticates the user via a JWT token (validated by a hook before this handler),
 * spawns a pseudo-terminal (pty), and streams data between the client and the server-side shell.
 *
 * @param {WebSocket} connection - The raw WebSocket connection object.
 * @param {FastifyRequest} request - The initial Fastify request that upgraded the connection.
 */
const handleWebConsoleConnection = (connection, request) => {
    try {
        // The authentication hook on the route should have already verified the token
        // and attached the user object to the request.
        if (!request.user) {
            request.log.warn('Web console connection attempt without authentication.');
            connection.send('Authentication failed. Closing connection.');
            connection.close(1008, 'Unauthorized'); // 1008: Policy Violation
            return;
        }
        request.log.info(`Web console connection established for user: ${request.user.username}`);
        // Spawn a new pseudo-terminal process.
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: os_1.default.homedir(),
            env: { ...process.env, 'USER': request.user.username },
        });
        // Pipe output from the pty to the WebSocket client.
        ptyProcess.onData((data) => {
            connection.send(data);
        });
        // Handle incoming messages from the WebSocket client.
        connection.on('message', (message) => {
            const msgStr = message.toString();
            try {
                // Check for special JSON messages, like resize events.
                const parsed = JSON.parse(msgStr);
                if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
                    ptyProcess.resize(parsed.cols, parsed.rows);
                }
            }
            catch (e) {
                // If it's not a JSON object, assume it's direct terminal input.
                ptyProcess.write(msgStr);
            }
        });
        // Handle the pty process exiting.
        ptyProcess.onExit(({ exitCode, signal }) => {
            request.log.info(`PTY process for user ${request.user.username} exited with code ${exitCode}, signal ${signal}.`);
            connection.close();
        });
        // Handle the WebSocket connection closing from the client side.
        connection.on('close', () => {
            request.log.info(`Web console connection closed for user: ${request.user.username}`);
            // Ensure the pty process is killed when the client disconnects.
            ptyProcess.kill();
        });
        // Handle WebSocket errors.
        connection.on('error', (error) => {
            request.log.error(`WebSocket error for user ${request.user.username}: ${error.message}`);
            ptyProcess.kill();
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        request.log.error(`Failed to handle web console connection: ${errorMessage}`);
        connection.send('An internal server error occurred.');
        connection.close();
    }
};
exports.handleWebConsoleConnection = handleWebConsoleConnection;
//# sourceMappingURL=webConsoleController.js.map