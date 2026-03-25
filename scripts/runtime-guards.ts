import { createServer } from 'node:net';

const MINIMUM_SUPPORTED_NODE_MAJOR = 24;

function parseNodeMajor(version: string): number | null {
  const [majorPart] = version.split('.');
  const major = Number.parseInt(majorPart ?? '', 10);
  return Number.isNaN(major) ? null : major;
}

export function getUnsupportedNodeVersionMessage(
  version: string
): string | null {
  const major = parseNodeMajor(version);

  if (major !== null && major >= MINIMUM_SUPPORTED_NODE_MAJOR) {
    return null;
  }

  return `Node ${version} is not supported for this repo. Use \`nvm use\` to switch to the version from \`.nvmrc\` before running this command again.`;
}

export function warnIfUnsupportedNodeVersion(
  version: string = process.versions.node
): void {
  const message = getUnsupportedNodeVersionMessage(version);

  if (message) {
    console.warn(message);
  }
}

export function getPortInUseMessage(port: number): string {
  return [
    `Port ${port} is already in use.`,
    'Another local dev server is probably already running.',
    'If you already have the site open, keep that server running and just refresh the browser.',
    `Otherwise stop the process using port ${port} and rerun \`pnpm dev:site -- --site <id>\`.`,
  ].join(' ');
}

export async function ensurePortAvailable(port: number): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const server = createServer();

    server.once('error', (error) => {
      server.close();

      if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        reject(new Error(getPortInUseMessage(port)));
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolvePromise());
    });

    server.listen(port);
  });
}
