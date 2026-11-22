import {mkdtemp, rm, symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {afterEach, describe, expect, it} from 'vite-plus/test';

import {isMainModule} from './isMain.ts';

const modulePath = fileURLToPath(new URL('./isMain.ts', import.meta.url));
const moduleUrl = pathToFileURL(modulePath).href;

const createdRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdRoots.map((rootDir) => rm(rootDir, {recursive: true, force: true}))
  );
  createdRoots.length = 0;
});

describe('isMainModule', () => {
  it('returns true when the entry path is the module path', () => {
    expect(isMainModule(moduleUrl, modulePath)).toBe(true);
  });

  it('returns true for a relative entry path resolving to the module', () => {
    const relativePath = path.relative(process.cwd(), modulePath);

    expect(isMainModule(moduleUrl, relativePath)).toBe(true);
  });

  it('returns false when the entry path is a different module', () => {
    expect(isMainModule(moduleUrl, path.resolve('scripts/entries.ts'))).toBe(
      false
    );
  });

  it('returns false when there is no entry path', () => {
    expect(isMainModule(moduleUrl, undefined)).toBe(false);
  });

  it('returns false when the entry path does not exist', () => {
    const missingPath = path.join(path.dirname(modulePath), 'missing.ts');

    expect(isMainModule(moduleUrl, missingPath)).toBe(false);
  });

  it('returns true when the entry path is a symlink to the module', async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), 'cryptovalid-is-main-')
    );

    createdRoots.push(rootDir);

    const linkPath = path.join(rootDir, 'isMain.ts');

    try {
      await symlink(modulePath, linkPath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      // Creating symlinks needs Developer Mode or elevation on Windows.
      if (code === 'EPERM' || code === 'ENOTSUP') {
        return;
      }

      throw error;
    }

    expect(isMainModule(pathToFileURL(linkPath).href, linkPath)).toBe(true);
  });

  it('matches the drive letter case on Windows', () => {
    if (process.platform !== 'win32') {
      return;
    }

    expect(isMainModule(moduleUrl, modulePath.toUpperCase())).toBe(true);
  });
});
