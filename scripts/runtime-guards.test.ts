import { createServer, type Server } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ensurePortAvailable,
  getPortInUseMessage,
  getUnsupportedNodeVersionMessage,
} from './runtime-guards.ts';

const serversToClose: Server[] = [];

afterEach(async () => {
  await Promise.all(
    serversToClose.splice(0).map(
      (server) =>
        new Promise<void>((resolvePromise, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolvePromise();
          });
        })
    )
  );
});

describe('getUnsupportedNodeVersionMessage', () => {
  it('returns a friendly fix for unsupported Node versions', () => {
    expect(getUnsupportedNodeVersionMessage('22.22.0')).toBe(
      'Node 22.22.0 is not supported for this repo. Use `nvm use` to switch to the version from `.nvmrc` before running this command again.'
    );
  });

  it('returns null for supported Node versions', () => {
    expect(getUnsupportedNodeVersionMessage('24.13.1')).toBeNull();
  });
});

describe('ensurePortAvailable', () => {
  it('throws a clear error when the target port is already in use', async () => {
    const server = createServer();
    serversToClose.push(server);

    await new Promise<void>((resolvePromise, reject) => {
      server.listen(0, () => {
        resolvePromise();
      });

      server.once('error', reject);
    });

    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Expected test server to bind to a numeric port');
    }

    await expect(
      ensurePortAvailable(address.port, 'pnpm dev:operator -- --site <id>')
    ).rejects.toThrowError(
      getPortInUseMessage(address.port, 'pnpm dev:operator -- --site <id>')
    );
  });
});
