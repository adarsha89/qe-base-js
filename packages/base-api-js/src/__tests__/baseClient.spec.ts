import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect, request, type APIRequestContext } from '@playwright/test';
import { BaseClient, ApiError } from '../client/BaseClient';

/**
 * Local mock server — this package's self-tests target it exclusively, never
 * a live external API (framework-guidelines.md §1, §6).
 */
function startMockServer(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = http.createServer((req, res) => {
    if (req.url === '/users/42' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ id: 42, name: 'Ada' }));
      return;
    }
    if (req.url === '/users' && req.method === 'POST') {
      res.writeHead(201, { 'Content-Type': 'application/json' }).end(JSON.stringify({ id: 1, name: 'New user' }));
      return;
    }
    if (req.url === '/empty' && req.method === 'DELETE') {
      res.writeHead(204).end();
      return;
    }
    if (req.url === '/boom') {
      res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'boom' }));
      return;
    }
    res.writeHead(404).end();
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

interface User {
  id: number;
  name: string;
}

/**
 * `get`/`post`/`put`/`delete` are `protected` on `BaseClient` by design — a
 * resource client extends it and exposes its own typed methods (see the
 * class doc). To self-test the base class's own behavior directly, this
 * tiny subclass just re-exposes each verb publicly, rather than reaching
 * past `protected` with a cast.
 */
class TestClient extends BaseClient {
  getUser(id: number): Promise<User> {
    return this.get<User>(`/users/:id`, { pathParams: { id } });
  }

  createUser(name: string): Promise<User> {
    return this.post<User>('/users', { data: { name } });
  }

  deleteEmpty(): Promise<undefined> {
    return this.delete<undefined>('/empty');
  }

  boom(): Promise<never> {
    return this.get<never>('/boom');
  }
}

let mockServer: { baseUrl: string; close: () => Promise<void> };
let apiRequest: APIRequestContext;
let client: TestClient;

test.beforeAll(async () => {
  mockServer = await startMockServer();
  apiRequest = await request.newContext();
  client = new TestClient(apiRequest, mockServer.baseUrl);
});

test.afterAll(async () => {
  await apiRequest.dispose();
  await mockServer.close();
});

test(
  'GET parses a 200 JSON body into the typed result',
  { tag: ['@integration', '@base-client-get-parses-json'] },
  async () => {
    expect(await client.getUser(42)).toEqual({ id: 42, name: 'Ada' });
  },
);

test(
  'POST sends the body and parses the 201 response',
  { tag: ['@integration', '@base-client-post-sends-body'] },
  async () => {
    expect(await client.createUser('New user')).toEqual({ id: 1, name: 'New user' });
  },
);

test(
  'DELETE returns undefined for a 204 No Content response',
  { tag: ['@integration', '@base-client-delete-204-undefined'] },
  async () => {
    expect(await client.deleteEmpty()).toBeUndefined();
  },
);

test(
  'a non-2xx response throws ApiError with the status and body attached',
  { tag: ['@integration', '@base-client-throws-api-error'] },
  async () => {
    const outcome = client.boom();
    await expect(outcome).rejects.toBeInstanceOf(ApiError);
    await expect(outcome).rejects.toMatchObject({ status: 500, body: { error: 'boom' } });
  },
);
