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
Object.defineProperty(exports, "__esModule", { value: true });
const stunnelService_1 = require("./stunnelService");
const fs = __importStar(require("fs/promises"));
// This object will hold our mock function, allowing us to bypass hoisting issues.
const childProcessMocks = {
    exec: jest.fn(),
};
// Mock the 'child_process' module.
jest.mock('child_process', () => ({
    // When the service code imports 'exec', it will get this function.
    // This function, in turn, calls our controllable mock.
    exec: (command, callback) => {
        childProcessMocks.exec(command, callback);
    },
}));
// Mock 'fs/promises' as before.
jest.mock('fs/promises');
const mockedWriteFile = fs.writeFile;
describe('StunnelService', () => {
    let stunnelService;
    beforeEach(() => {
        jest.clearAllMocks();
        // Default implementation for the exec mock.
        // The promisified version in the service will see this.
        childProcessMocks.exec.mockImplementation((command, callback) => {
            callback(null, '', '');
        });
        mockedWriteFile.mockResolvedValue(undefined);
        stunnelService = new stunnelService_1.StunnelService();
    });
    describe('isStunnelActive', () => {
        it('should return true when command output is "active"', async () => {
            // Arrange
            // Because the service uses promisify, we need to mock the callback behavior.
            // The promise will resolve with the second argument of the callback if the first is null.
            childProcessMocks.exec.mockImplementation((command, callback) => {
                if (command === 'systemctl is-active stunnel4') {
                    // This structure is what promisify(exec) expects.
                    // It resolves with an object containing stdout and stderr.
                    callback(null, { stdout: 'active\n', stderr: '' });
                }
            });
            const isActive = await stunnelService.isStunnelActive();
            expect(isActive).toBe(true);
            expect(childProcessMocks.exec).toHaveBeenCalledWith('systemctl is-active stunnel4', expect.any(Function));
        });
        it('should return false when command fails', async () => {
            childProcessMocks.exec.mockImplementation((command, callback) => {
                callback(new Error('command failed'), '', '');
            });
            const isActive = await stunnelService.isStunnelActive();
            expect(isActive).toBe(false);
        });
    });
    describe('disableStunnel', () => {
        it('should call systemctl stop and return true', async () => {
            const result = await stunnelService.disableStunnel(443, false);
            expect(result).toBe(true);
            expect(childProcessMocks.exec).toHaveBeenCalledWith('sudo systemctl stop stunnel4', expect.any(Function));
        });
    });
    describe('enableStunnel', () => {
        it('should call all commands and return true on success', async () => {
            // Spy on the private method, as it's easier than checking all its inner exec calls.
            const updateSshdConfigSpy = jest.spyOn(stunnelService, 'updateSshdConfig').mockResolvedValue(undefined);
            const result = await stunnelService.enableStunnel(443);
            expect(result).toBe(true);
            expect(updateSshdConfigSpy).toHaveBeenCalledWith(443, false);
            // Check a few key commands to ensure the flow is correct
            expect(childProcessMocks.exec).toHaveBeenCalledWith('sudo mkdir -p /etc/stunnel', expect.any(Function));
            expect(childProcessMocks.exec).toHaveBeenCalledWith(expect.stringContaining('openssl'), expect.any(Function));
            expect(childProcessMocks.exec).toHaveBeenCalledWith('sudo systemctl restart stunnel4', expect.any(Function));
            updateSshdConfigSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=stunnelService.test.js.map