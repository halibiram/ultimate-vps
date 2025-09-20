"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sshService_1 = require("./sshService");
const child_process_1 = require("child_process");
jest.mock('child_process', () => ({
    exec: jest.fn(),
}));
const execMock = child_process_1.exec;
describe('SSHService', () => {
    let sshService;
    beforeEach(() => {
        sshService = new sshService_1.SSHService();
        jest.resetAllMocks();
    });
    describe('createSSHUser', () => {
        it('should return true if user is created successfully', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(null, { stdout: '', stderr: '' });
            });
            const result = await sshService.createSSHUser('testuser', 'password');
            expect(result).toBe(true);
            expect(execMock).toHaveBeenCalledWith('sudo useradd -m -s /bin/bash testuser', expect.any(Function));
            expect(execMock).toHaveBeenCalledWith("echo 'testuser:password' | sudo chpasswd", expect.any(Function));
        });
        it('should return false if an error occurs', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(new Error('test error'));
            });
            const result = await sshService.createSSHUser('testuser', 'password');
            expect(result).toBe(false);
        });
    });
    describe('deleteSSHUser', () => {
        it('should return true if user is deleted successfully', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(null, { stdout: '', stderr: '' });
            });
            const result = await sshService.deleteSSHUser('testuser');
            expect(result).toBe(true);
            expect(execMock).toHaveBeenCalledWith('sudo userdel -r testuser', expect.any(Function));
        });
        it('should return false if an error occurs', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(new Error('userdel failed'));
            });
            const result = await sshService.deleteSSHUser('testuser');
            expect(result).toBe(false);
        });
    });
    describe('toggleUserLock', () => {
        it('should lock a user and return true on success', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(null, { stdout: '', stderr: '' });
            });
            const result = await sshService.toggleUserLock('testuser', true);
            expect(result).toBe(true);
            expect(execMock).toHaveBeenCalledWith('sudo usermod -L testuser', expect.any(Function));
        });
        it('should unlock a user and return true on success', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(null, { stdout: '', stderr: '' });
            });
            const result = await sshService.toggleUserLock('testuser', false);
            expect(result).toBe(true);
            expect(execMock).toHaveBeenCalledWith('sudo usermod -U testuser', expect.any(Function));
        });
        it('should return false if an error occurs', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(new Error('usermod failed'));
            });
            const result = await sshService.toggleUserLock('testuser', true);
            expect(result).toBe(false);
        });
    });
    describe('getUserConnections', () => {
        it('should return the number of user connections', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(null, { stdout: '3\n', stderr: '' });
            });
            const connections = await sshService.getUserConnections('testuser');
            expect(connections).toBe(3);
            expect(execMock).toHaveBeenCalledWith('who | grep "^testuser " | wc -l', expect.any(Function));
        });
        it('should return 0 if there are no connections', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(new Error('grep failed'));
            });
            const connections = await sshService.getUserConnections('testuser');
            expect(connections).toBe(0);
        });
        it('should return 0 if stdout is not a number', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(null, { stdout: 'not a number', stderr: '' });
            });
            const connections = await sshService.getUserConnections('testuser');
            expect(connections).toBe(0);
        });
    });
    describe('getActiveConnections', () => {
        it('should return active connections for monitored ports', async () => {
            execMock
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: '2\n', stderr: '' })) // port 22
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: '1\n', stderr: '' })) // port 80
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: '11\n', stderr: '' })) // port 443
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: '6\n', stderr: '' })); // port 444
            const connections = await sshService.getActiveConnections();
            expect(connections).toEqual([
                { service: 'SSH-22', port: 22, connections: 1 },
                { service: 'Dropbear-80', port: 80, connections: 0 },
                { service: 'Dropbear-443', port: 443, connections: 10 },
                { service: 'SSH-444', port: 444, connections: 5 },
            ]);
        });
        it('should return an empty array if an error occurs', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(new Error('ss failed'));
            });
            const connections = await sshService.getActiveConnections();
            expect(connections).toEqual([]);
        });
    });
    describe('getServerStats', () => {
        it('should return server stats on success', async () => {
            execMock
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: '12.3', stderr: '' })) // cpu
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: '45.6', stderr: '' })) // ram
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: '78.9', stderr: '' })) // disk
                .mockImplementationOnce((cmd, cb) => cb(null, { stdout: 'RX: 123 bytes, TX: 456 bytes', stderr: '' })); // network
            const stats = await sshService.getServerStats();
            expect(stats.cpu).toBe(12.3);
            expect(stats.ram).toBe(45.6);
            expect(stats.disk).toBe(78.9);
            expect(stats.network).toBe('RX: 123 bytes, TX: 456 bytes');
            expect(stats.timestamp).toBeInstanceOf(Date);
        });
        it('should return null if an error occurs', async () => {
            execMock.mockImplementation((command, callback) => {
                callback(new Error('command failed'));
            });
            const stats = await sshService.getServerStats();
            expect(stats).toBeNull();
        });
    });
});
//# sourceMappingURL=sshService.test.js.map