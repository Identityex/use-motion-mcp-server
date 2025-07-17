// Jest setup file for Motion MCP Server
// Configures test environment for ES modules

import { jest } from '@jest/globals';

// Global test configuration
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test if there's an unhandled rejection
  throw reason;
});

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
// Keep console.error for debugging
globalThis.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};