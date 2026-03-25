import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget,
} from './site-config.ts';
import { prepareSiteData } from './site-data.ts';

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

export async function devSite(input: SiteInputTarget): Promise<void> {
  const definition = loadCheckedInSiteFromInput(input);
  const prepared = prepareSiteData(input);

  console.log(`Prepared listing data for ${prepared.siteId}`);
  console.log(`Source: ${prepared.sourcePathDisplay} (${prepared.sourceKind})`);
  console.log(`Output: ${prepared.outputPathDisplay}`);
  console.log(`Starting web dev server for ${definition.id}`);

  const child = spawn('pnpm', ['--filter', 'web', 'dev'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_ID: definition.id,
      SITE_ID: definition.id,
    },
    stdio: 'inherit',
  });

  forwardSignal(child, 'SIGINT');
  forwardSignal(child, 'SIGTERM');

  await new Promise<void>((resolvePromise, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code && code !== 0) {
        reject(new Error(`pnpm --filter web dev exited with code ${code}`));
        return;
      }

      resolvePromise();
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  devSite(parseSiteInputArgs(process.argv.slice(2))).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
