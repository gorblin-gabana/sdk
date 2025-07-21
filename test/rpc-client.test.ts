import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { RpcClient } from '../src/rpc/client';
import { getGorbchainConfig } from '../src/utils/gorbchainConfig';

// Mock fetch for testing
global.fetch = jest.fn();

describe('RpcClient Tests', () => {
  let client: RpcClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = new RpcClient({
      rpcUrl: 'https://test-rpc.gorbchain.xyz',
      timeout: 5000,
      retries: 2
    });
  });

  describe('Client Configuration', () => {
    test('should use gorbchain config by default', () => {
      const config = getGorbchainConfig();
      const defaultClient = new RpcClient();
      expect(defaultClient.getRpcUrl()).toBe(config.rpcUrl || 'https://rpc.gorbchain.xyz');
    });

    test('should allow custom configuration', () => {
      expect(client.getRpcUrl()).toBe('https://test-rpc.gorbchain.xyz');
    });

    test('should allow endpoint updates', () => {
      client.setRpcUrl('https://new-endpoint.com');
      expect(client.getRpcUrl()).toBe('https://new-endpoint.com');
    });
  });

  describe('RPC Request Handling', () => {
    test('should make successful RPC requests', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: { slot: 12345 }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await client.request<{ slot: number }>('getSlot', []);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-rpc.gorbchain.xyz',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSlot',
            params: []
          })
        })
      );
      expect(result).toEqual({ slot: 12345 });
    });

    test('should handle RPC errors', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Invalid params'
          }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(client.request('getSlot', ['invalid']))
        .rejects.toThrow(/Invalid params/);
    });

    test('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Internal Server Error')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(client.request('getSlot'))
        .rejects.toThrow(/500|Internal Server Error/);
    });

    test('should retry on network errors', async () => {
      // First attempt fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            jsonrpc: '2.0',
            id: 2,
            result: { success: true }
          })
        } as any);

      const result = await client.request('getHealth');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    test('should not retry on 4xx errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Bad Request'),
        json: jest.fn().mockRejectedValue(new Error('Bad Request'))
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      // Create a client with no retries to ensure 4xx errors aren't retried
      const noRetryClient = new RpcClient({
        rpcUrl: 'https://rpc.gorbchain.xyz',
        timeout: 5000,
        retries: 0 // No retries
      });

      await expect(noRetryClient.request('invalidMethod'))
        .rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should handle timeout', async () => {
      // Mock a delayed response
      mockFetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const shortTimeoutClient = new RpcClient({
        rpcUrl: 'https://test-rpc.gorbchain.xyz',
        timeout: 100,
        retries: 1
      });

      await expect(shortTimeoutClient.request('getSlot'))
        .rejects.toThrow();
    });
  });

  describe('Built-in RPC Methods', () => {
    test('should get health status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: 'ok'
        })
      } as any);

      const health = await client.getHealth();
      expect(health).toBe('ok');
    });

    test('should get current slot', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: 12345
        })
      } as any);

      const slot = await client.getSlot();
      expect(slot).toBe(12345);
    });

    test('should get block height', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: 98765
        })
      } as any);

      const height = await client.getBlockHeight();
      expect(height).toBe(98765);
    });

    test('should get version', async () => {
      const mockVersion = { 'solana-core': '1.14.0', 'feature-set': 12345 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: mockVersion
        })
      } as any);

      const version = await client.getVersion();
      expect(version).toEqual(mockVersion);
    });

    test('should get latest blockhash', async () => {
      const mockBlockhash = {
        value: {
          blockhash: 'ABC123',
          lastValidBlockHeight: 54321
        }
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: mockBlockhash
        })
      } as any);

      const result = await client.getLatestBlockhash();
      expect(result).toEqual({
        blockhash: 'ABC123',
        lastValidBlockHeight: 54321
      });
    });
  });

  describe('Request ID Management', () => {
    test('should increment request IDs', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: 'ok'
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      // Make multiple requests
      await client.request('getHealth');
      await client.request('getHealth');
      await client.request('getHealth');

      // Check that request IDs increment
      const calls = mockFetch.mock.calls;
      expect(calls).toHaveLength(3);

      const firstBody = JSON.parse(calls[0][1]?.body as string);
      const secondBody = JSON.parse(calls[1][1]?.body as string);
      const thirdBody = JSON.parse(calls[2][1]?.body as string);

      expect(firstBody.id).toBe(1);
      expect(secondBody.id).toBe(2);
      expect(thirdBody.id).toBe(3);
    });
  });
});
