import { FastifyRequest, FastifyReply } from 'fastify';

// We will dynamically import the controller after setting up mocks.
let deleteSshAccount: any;

// Define mock implementations that we can control in tests.
const mockSshService = {
  deleteSSHUser: jest.fn(),
};
const mockPrismaClient = {
  sSHAccount: {
    delete: jest.fn(),
  },
};

describe('deleteSshAccount', () => {
  let request: FastifyRequest;
  let reply: FastifyReply;
  const username = 'testuser';

  beforeEach(() => {
    // Reset modules to ensure mocks are applied cleanly for each test.
    jest.resetModules();

    // Use jest.doMock to set up mocks BEFORE the controller is imported.
    jest.doMock('../services/sshService', () => ({
      SSHService: jest.fn().mockImplementation(() => mockSshService),
    }));
    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
    }));

    // Now that mocks are in place, import the controller.
    deleteSshAccount = require('./sshController').deleteSshAccount;

    // Reset mock function history for a clean test slate.
    mockSshService.deleteSSHUser.mockReset();
    mockPrismaClient.sSHAccount.delete.mockReset();

    // Set up standard Fastify request/reply objects.
    request = { params: { username } } as any;
    reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;
  });

  it('should return 500 and not delete from DB if system user deletion fails', async () => {
    // Arrange: OS deletion fails.
    mockSshService.deleteSSHUser.mockResolvedValue(false);

    // Act
    await deleteSshAccount(request, reply);

    // Assert: The correct logic.
    expect(mockSshService.deleteSSHUser).toHaveBeenCalledWith(username);
    expect(mockPrismaClient.sSHAccount.delete).not.toHaveBeenCalled();
    expect(reply.code).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ message: 'Failed to delete system user. Operation aborted.' });
  });

  it('should return 204 and delete both user and DB record on success', async () => {
    // Arrange: Both OS and DB operations succeed.
    mockSshService.deleteSSHUser.mockResolvedValue(true);
    mockPrismaClient.sSHAccount.delete.mockResolvedValue({});

    // Act
    await deleteSshAccount(request, reply);

    // Assert
    const sshDeleteCall = mockSshService.deleteSSHUser.mock.invocationCallOrder[0];
    const prismaDeleteCall = mockPrismaClient.sSHAccount.delete.mock.invocationCallOrder[0];

    expect(sshDeleteCall).toBeLessThan(prismaDeleteCall); // OS user deleted before DB record.
    expect(reply.code).toHaveBeenCalledWith(204);
  });

  it('should return 404 if the user exists on the system but not in the database', async () => {
    // Arrange
    mockSshService.deleteSSHUser.mockResolvedValue(true); // OS user is deleted...
    mockPrismaClient.sSHAccount.delete.mockRejectedValue({ code: 'P2025' }); // ...but they weren't in the DB.

    // Act
    await deleteSshAccount(request, reply);

    // Assert
    expect(reply.code).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({ message: 'Account not found.' });
  });
});
