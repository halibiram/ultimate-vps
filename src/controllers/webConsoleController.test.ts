import { FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { handleWebConsoleConnection } from './webConsoleController';
import * as pty from 'node-pty';
import os from 'os';

// Define the mock pty process object that we can reference in tests
const mockPtyProcess = {
  onData: jest.fn(),
  onExit: jest.fn(),
  write: jest.fn(),
  resize: jest.fn(),
  kill: jest.fn(),
};

// Mock the node-pty library
jest.mock('node-pty', () => ({
  spawn: jest.fn(() => mockPtyProcess),
}));

// Mock the os module to have a predictable platform
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  platform: jest.fn(() => 'linux'),
  homedir: jest.fn(() => '/home/testuser'),
}));


describe('handleWebConsoleConnection', () => {
  let mockConnection: WebSocket;
  let mockRequest: FastifyRequest;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Also reset the properties of our manual mock object
    mockPtyProcess.onData.mockReset();
    mockPtyProcess.onExit.mockReset();
    mockPtyProcess.write.mockReset();
    mockPtyProcess.resize.mockReset();
    mockPtyProcess.kill.mockReset();

    // Create a mock WebSocket connection object
    mockConnection = {
      send: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
    } as unknown as WebSocket;

    // Create a mock Fastify request object
    mockRequest = {
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      user: { // Simulate an authenticated user
        id: 1,
        username: 'testuser',
        isAdmin: true,
      },
    } as unknown as FastifyRequest;
  });

  it('should spawn a pty process with the correct shell and environment on successful connection', () => {
    // Arrange
    const expectedShell = 'bash';
    const expectedCwd = '/home/testuser';

    // Act
    handleWebConsoleConnection(mockConnection as any, mockRequest);

    // Assert
    expect(pty.spawn).toHaveBeenCalledTimes(1);
    expect(pty.spawn).toHaveBeenCalledWith(
      expectedShell,
      [],
      {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: expectedCwd,
        env: expect.objectContaining({ 'USER': mockRequest.user.username }),
      }
    );
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      `Web console connection established for user: ${mockRequest.user.username}`
    );
  });

  it('should send data from the pty process to the WebSocket client', () => {
    // Arrange: Call the handler to set up the listeners
    handleWebConsoleConnection(mockConnection as any, mockRequest);

    // Act: Capture the onData callback and simulate the pty sending data
    const onDataCallback = mockPtyProcess.onData.mock.calls[0][0];
    const testData = 'hello from the shell';
    onDataCallback(testData);

    // Assert: Check that the data was sent over the WebSocket
    expect(mockConnection.send).toHaveBeenCalledTimes(1);
    expect(mockConnection.send).toHaveBeenCalledWith(testData);
  });

  it('should write incoming WebSocket data to the pty process', () => {
    // Arrange: Call the handler to set up the listeners
    handleWebConsoleConnection(mockConnection as any, mockRequest);

    // Act: Capture the on('message') callback and simulate the client sending data
    const onMessageCallback = (mockConnection.on as jest.Mock).mock.calls.find(call => call[0] === 'message')[1];
    const clientInput = 'ls -la\n';
    onMessageCallback(clientInput);

    // Assert: Check that the data was written to the pty
    expect(mockPtyProcess.write).toHaveBeenCalledTimes(1);
    expect(mockPtyProcess.write).toHaveBeenCalledWith(clientInput);
  });

  it('should resize the pty process when a resize message is received', () => {
    // Arrange
    handleWebConsoleConnection(mockConnection as any, mockRequest);
    const onMessageCallback = (mockConnection.on as jest.Mock).mock.calls.find(call => call[0] === 'message')[1];
    const resizeMessage = JSON.stringify({ type: 'resize', cols: 120, rows: 40 });

    // Act
    onMessageCallback(resizeMessage);

    // Assert
    expect(mockPtyProcess.resize).toHaveBeenCalledTimes(1);
    expect(mockPtyProcess.resize).toHaveBeenCalledWith(120, 40);
    // Ensure that normal input is not processed
    expect(mockPtyProcess.write).not.toHaveBeenCalled();
  });

  it('should kill the pty process when the WebSocket connection closes', () => {
    // Arrange
    handleWebConsoleConnection(mockConnection as any, mockRequest);

    // Act: Capture and call the 'close' event handler
    const onCloseCallback = (mockConnection.on as jest.Mock).mock.calls.find(call => call[0] === 'close')[1];
    onCloseCallback();

    // Assert
    expect(mockPtyProcess.kill).toHaveBeenCalledTimes(1);
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      `Web console connection closed for user: ${mockRequest.user.username}`
    );
  });

  it('should close the WebSocket when the pty process exits', () => {
    // Arrange
    handleWebConsoleConnection(mockConnection as any, mockRequest);

    // Act: Capture and call the onExit handler
    const onExitCallback = mockPtyProcess.onExit.mock.calls[0][0];
    onExitCallback({ exitCode: 0, signal: 0 });

    // Assert
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      `PTY process for user ${mockRequest.user.username} exited with code 0, signal 0.`
    );
  });

  it('should not spawn a pty and should close the connection if the user is not authenticated', () => {
    // Arrange
    (mockRequest as any).user = null; // Simulate an unauthenticated request by bypassing TypeScript's type safety

    // Act
    handleWebConsoleConnection(mockConnection as any, mockRequest);

    // Assert
    expect(pty.spawn).not.toHaveBeenCalled();
    expect(mockConnection.send).toHaveBeenCalledWith('Authentication failed. Closing connection.');
    expect(mockConnection.close).toHaveBeenCalledWith(1008, 'Unauthorized');
    expect(mockRequest.log.warn).toHaveBeenCalledWith('Web console connection attempt without authentication.');
  });
});
