import { describe, expect, it } from 'vitest';
import { defaultSiteConfig } from '../packages/site-contract/src/default-site-config.ts';
import {
  DEFAULT_STARTER_APP_OUT_DIR,
  DEFAULT_STARTER_APP_PACKAGE_NAME,
} from '../packages/site-contract/src/starter-app-defaults.ts';

describe('starter app defaults', () => {
  it('uses the neutral starter workspace name and output directory', () => {
    expect(DEFAULT_STARTER_APP_PACKAGE_NAME).toBe('starter');
    expect(DEFAULT_STARTER_APP_OUT_DIR).toBe('apps/starter/out');
    expect(defaultSiteConfig.build.appPackageName).toBe('starter');
    expect(defaultSiteConfig.build.appOutDir).toBe('apps/starter/out');
  });
});
