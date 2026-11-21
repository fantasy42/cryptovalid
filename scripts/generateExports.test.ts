import {promises as fs} from 'node:fs';
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  utimes,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, describe, expect, it, vi} from 'vite-plus/test';

import {buildExports} from './buildExports.ts';
import {ENTRIES} from './entries.ts';
import {generateExports} from './generateExports.ts';

const createdRoots: string[] = [];

async function createRoot(): Promise<string> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'cryptovalid-exports-'));

  createdRoots.push(rootDir);

  return rootDir;
}

async function createFixture(pkg: unknown): Promise<string> {
  const rootDir = await createRoot();

  await writeFile(
    path.join(rootDir, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`
  );

  return rootDir;
}

async function createRawFixture(contents: string): Promise<string> {
  const rootDir = await createRoot();

  await writeFile(path.join(rootDir, 'package.json'), contents);

  return rootDir;
}

async function readPkg(rootDir: string): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(path.join(rootDir, 'package.json'), 'utf8')
  ) as Record<string, unknown>;
}

afterEach(async () => {
  vi.restoreAllMocks();

  await Promise.all(
    createdRoots.map((rootDir) => rm(rootDir, {recursive: true, force: true}))
  );
  createdRoots.length = 0;
});

describe('generateExports', () => {
  it('adds the generated exports and reports a change', async () => {
    const rootDir = await createFixture({name: 'fixture', version: '1.0.0'});
    const pkgPath = path.join(rootDir, 'package.json');

    await expect(
      generateExports({rootDir, entries: ['index', 'btc']})
    ).resolves.toEqual({changed: true, pkgPath});

    await expect(readPkg(rootDir)).resolves.toEqual({
      name: 'fixture',
      version: '1.0.0',
      exports: buildExports(['index', 'btc']),
    });
  });

  it('defaults to every manifest entry', async () => {
    const rootDir = await createFixture({name: 'fixture', version: '1.0.0'});

    await generateExports({rootDir});

    await expect(readPkg(rootDir)).resolves.toEqual({
      name: 'fixture',
      version: '1.0.0',
      exports: buildExports(Object.keys(ENTRIES)),
    });
  });

  it('leaves an up-to-date package.json byte-for-byte unchanged', async () => {
    const rootDir = await createFixture({
      name: 'fixture',
      version: '1.0.0',
      exports: buildExports(['index', 'btc']),
    });
    const pkgPath = path.join(rootDir, 'package.json');
    const before = await readFile(pkgPath, 'utf8');

    await expect(
      generateExports({rootDir, entries: ['index', 'btc']})
    ).resolves.toEqual({changed: false, pkgPath});

    await expect(readFile(pkgPath, 'utf8')).resolves.toBe(before);
  });

  it('does not rewrite an up-to-date package.json', async () => {
    const rootDir = await createFixture({
      name: 'fixture',
      version: '1.0.0',
      exports: buildExports(['index']),
    });
    const pkgPath = path.join(rootDir, 'package.json');
    const fixedTime = new Date('2000-01-01T00:00:00.000Z');

    await utimes(pkgPath, fixedTime, fixedTime);
    const before = await stat(pkgPath);

    await generateExports({rootDir, entries: ['index']});

    const after = await stat(pkgPath);

    expect(after.mtimeMs).toBe(before.mtimeMs);
  });

  it('preserves unrelated fields and the exports key position', async () => {
    const rootDir = await createFixture({
      name: 'fixture',
      exports: {'./stale': './stale.js'},
      custom: {nested: true},
      version: '1.0.0',
    });

    await generateExports({rootDir, entries: ['index']});

    const pkg = await readPkg(rootDir);

    expect(pkg).toEqual({
      name: 'fixture',
      exports: buildExports(['index']),
      custom: {nested: true},
      version: '1.0.0',
    });
    expect(Object.keys(pkg)).toEqual(['name', 'exports', 'custom', 'version']);
  });

  it('writes through a temporary file in the target directory', async () => {
    const rootDir = await createFixture({name: 'fixture', version: '1.0.0'});
    const pkgPath = path.join(rootDir, 'package.json');
    const writeFileSpy = vi.spyOn(fs, 'writeFile');
    const renameSpy = vi.spyOn(fs, 'rename');

    await generateExports({rootDir, entries: ['index']});

    expect(writeFileSpy).toHaveBeenCalledTimes(1);

    const [tempPath] = writeFileSpy.mock.calls[0]!;

    if (typeof tempPath !== 'string') {
      throw new Error('Expected generateExports to use a string temp path.');
    }

    expect(tempPath).not.toBe(pkgPath);
    expect(path.dirname(tempPath)).toBe(rootDir);
    expect(renameSpy).toHaveBeenCalledWith(tempPath, pkgPath);
  });

  it('keeps the directory free of temporary files', async () => {
    const rootDir = await createFixture({name: 'fixture', version: '1.0.0'});

    await generateExports({rootDir, entries: ['index']});

    await expect(readdir(rootDir)).resolves.toEqual(['package.json']);
  });

  it('cleans up and preserves package.json when the rename fails', async () => {
    const rootDir = await createFixture({name: 'fixture', version: '1.0.0'});
    const pkgPath = path.join(rootDir, 'package.json');
    const before = await readFile(pkgPath, 'utf8');

    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('rename failed'));

    await expect(
      generateExports({rootDir, entries: ['index']})
    ).rejects.toThrow(/Failed to generate exports/);

    await expect(readFile(pkgPath, 'utf8')).resolves.toBe(before);
    await expect(readdir(rootDir)).resolves.toEqual(['package.json']);
  });

  it('rejects JSON values that are not objects', async () => {
    for (const raw of ['[]', 'null', '"fixture"', '42', 'true']) {
      const rootDir = await createRawFixture(raw);
      const pkgPath = path.join(rootDir, 'package.json');

      await expect(
        generateExports({rootDir, entries: ['index']})
      ).rejects.toThrow(/Failed to generate exports/);

      await expect(readFile(pkgPath, 'utf8')).resolves.toBe(raw);
    }
  });

  it('rejects malformed JSON without rewriting the file', async () => {
    const rootDir = await createRawFixture('{not json');
    const pkgPath = path.join(rootDir, 'package.json');

    await expect(
      generateExports({rootDir, entries: ['index']})
    ).rejects.toThrow(/Failed to generate exports/);

    await expect(readFile(pkgPath, 'utf8')).resolves.toBe('{not json');
  });
});
