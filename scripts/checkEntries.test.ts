import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterEach, describe, expect, it} from 'vite-plus/test';

import {auditEntries} from './checkEntries.ts';
import {defineEntries} from './entries.ts';

const fixtureEntries = defineEntries({
  index: 'src/index.ts',
  any: 'src/any/index.ts',
  constants: 'src/constants.ts',
  btc: 'src/chains/btc.ts',
  'usdt-erc20': 'src/aliases/usdt-erc20.ts',
});

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const createdRoots: string[] = [];

async function createFixture(): Promise<string> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'cryptovalid-entries-'));

  createdRoots.push(rootDir);

  await mkdir(path.join(rootDir, 'src/chains'), {recursive: true});
  await mkdir(path.join(rootDir, 'src/aliases'), {recursive: true});
  await mkdir(path.join(rootDir, 'src/any'), {recursive: true});

  await writeFile(path.join(rootDir, 'src/index.ts'), 'export {};\n');
  await writeFile(path.join(rootDir, 'src/any/index.ts'), 'export {};\n');
  await writeFile(path.join(rootDir, 'src/constants.ts'), 'export {};\n');
  await writeFile(path.join(rootDir, 'src/chains/btc.ts'), 'export {};\n');
  await writeFile(
    path.join(rootDir, 'src/aliases/usdt-erc20.ts'),
    'export {};\n'
  );

  return rootDir;
}

async function writeSource(
  rootDir: string,
  relativePath: string
): Promise<void> {
  await writeFile(path.join(rootDir, relativePath), 'export {};\n');
}

afterEach(async () => {
  await Promise.all(
    createdRoots.map((rootDir) => rm(rootDir, {recursive: true, force: true}))
  );
  createdRoots.length = 0;
});

describe('auditEntries', () => {
  it('returns no issues for a complete manifest', async () => {
    const rootDir = await createFixture();

    await expect(
      auditEntries({rootDir, entries: fixtureEntries})
    ).resolves.toEqual([]);
  });

  it('reports an unlisted chain file', async () => {
    const rootDir = await createFixture();
    await writeSource(rootDir, 'src/chains/foo.ts');

    const issues = await auditEntries({rootDir, entries: fixtureEntries});

    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe('unlisted');
    expect(issues[0]?.file).toBe('src/chains/foo.ts');
    expect(issues[0]?.message).toBe(
      'src/chains/foo.ts is not listed in scripts/entries.ts. Add it to the manifest or move it out of src/chains or src/aliases.'
    );
  });

  it('reports index.ts helpers and declaration files', async () => {
    const rootDir = await createFixture();
    await writeSource(rootDir, 'src/chains/index.ts');
    await writeSource(rootDir, 'src/chains/btc.d.ts');

    const issues = await auditEntries({rootDir, entries: fixtureEntries});

    expect(issues.map((issue) => issue.file)).toEqual([
      'src/chains/btc.d.ts',
      'src/chains/index.ts',
    ]);
    expect(issues[0]?.message).toBe(
      'src/chains/btc.d.ts is a declaration file and cannot be an entry. Move it out of src/chains or src/aliases.'
    );
    expect(issues[1]?.message).toBe(
      'src/chains/index.ts is an index.ts helper and cannot be an entry. Move it out of src/chains or src/aliases.'
    );
  });

  it('reports a listed file that does not exist', async () => {
    const rootDir = await createFixture();
    await rm(path.join(rootDir, 'src/chains/btc.ts'));

    const issues = await auditEntries({rootDir, entries: fixtureEntries});

    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe('missing');
    expect(issues[0]?.file).toBe('src/chains/btc.ts');
    expect(issues[0]?.message).toContain('does not exist');
  });

  it('reports a missing fixed entry', async () => {
    const rootDir = await createFixture();
    await rm(path.join(rootDir, 'src/any/index.ts'));

    const issues = await auditEntries({rootDir, entries: fixtureEntries});

    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe('missing');
    expect(issues[0]?.file).toBe('src/any/index.ts');
  });

  it('reports a listed path that is not a regular file', async () => {
    const rootDir = await createFixture();
    await mkdir(path.join(rootDir, 'src/chains/dir.ts'));
    const entries = defineEntries({
      ...fixtureEntries,
      dir: 'src/chains/dir.ts',
    });

    const issues = await auditEntries({rootDir, entries});

    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe('missing');
    expect(issues[0]?.message).toContain('not a regular file');
  });

  it('reports a listed file that the audit did not find', async () => {
    const rootDir = await createFixture();

    const issues = await auditEntries({
      rootDir,
      entries: fixtureEntries,
      ignore: ['src/chains/btc.ts'],
    });

    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe('missing');
    expect(issues[0]?.file).toBe('src/chains/btc.ts');
    expect(issues[0]?.message).toBe(
      'src/chains/btc.ts is listed as entry "btc" but was not found by the entry audit. Check the audit root and ignore patterns.'
    );
  });

  it('ignores co-located test files', async () => {
    const rootDir = await createFixture();
    await writeSource(rootDir, 'src/chains/btc.test.ts');
    await writeSource(rootDir, 'src/chains/btc.spec.ts');
    await writeSource(rootDir, 'src/aliases/usdt-erc20.test.ts');

    await expect(
      auditEntries({rootDir, entries: fixtureEntries})
    ).resolves.toEqual([]);
  });

  it('ignores nested internal files', async () => {
    const rootDir = await createFixture();
    await mkdir(path.join(rootDir, 'src/chains/internal'), {
      recursive: true,
    });
    await writeSource(rootDir, 'src/chains/internal/helper.ts');

    await expect(
      auditEntries({rootDir, entries: fixtureEntries})
    ).resolves.toEqual([]);
  });

  it('has no unlisted entry files in this repository', async () => {
    await expect(auditEntries({rootDir: repoRoot})).resolves.toEqual([]);
  });
});
