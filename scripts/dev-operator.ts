import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ensurePortAvailable,
  warnIfUnsupportedNodeVersion,
} from './runtime-guards.ts';
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget,
} from './site-config.ts';
import { prepareSiteData } from './site-data.ts';
import { validateSite } from './validate-site.ts';

const DEFAULT_WEB_DEV_PORT = 3005;

function resolveDevPort(): number {
  const rawPort =
    process.env.OPERATOR_UI_PORT ??
    process.env.WEB_DEV_PORT ??
    process.env.PORT;

  if (!rawPort) {
    return DEFAULT_WEB_DEV_PORT;
  }

  const parsedPort = Number.parseInt(rawPort, 10);

  return Number.isNaN(parsedPort) ? DEFAULT_WEB_DEV_PORT : parsedPort;
}

function forwardSignal(
  child: ReturnType<typeof spawn>,
  signal: NodeJS.Signals
): void {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
}

export async function devOperator(input: SiteInputTarget): Promise<void> {
  warnIfUnsupportedNodeVersion();

  const definition = loadCheckedInSiteFromInput(input);
  const devPort = resolveDevPort();
  const prepared = prepareSiteData(input);

  console.log(`Prepared listing data for ${prepared.siteId}`);
  console.log(`Source: ${prepared.sourcePathDisplay} (${prepared.sourceKind})`);
  console.log(`Output: ${prepared.outputPathDisplay}`);
  validateSite(input);
  await ensurePortAvailable(devPort, 'pnpm dev:operator -- --site <id>');
  console.log(`Starting operator UI for ${definition.id}`);
  console.log(`Open: http://localhost:${devPort}/operator/onboard-site`);

  const child = spawn(
    'pnpm',
    [
      '--filter',
      'web',
      'exec',
      'next',
      'dev',
      '--webpack',
      '--port',
      String(devPort),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ENABLE_OPERATOR_UI: 'true',
        NEXT_PUBLIC_SITE_ID: definition.id,
        SITE_ID: definition.id,
      },
      stdio: 'inherit',
    }
  );

  forwardSignal(child, 'SIGINT');
  forwardSignal(child, 'SIGTERM');

  await new Promise<void>((resolvePromise, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code && code !== 0) {
        reject(new Error(`operator dev server exited with code ${code}`));
        return;
      }

      resolvePromise();
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  devOperator(parseSiteInputArgs(process.argv.slice(2))).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
