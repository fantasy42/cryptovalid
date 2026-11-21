import type {ConditionalExport, PackageExport} from './buildExports.ts';

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vite-plus/test';

import {buildExports, conditions, getModules} from './buildExports.ts';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

async function readPackageExports(): Promise<Record<string, PackageExport>> {
  const pkg = JSON.parse(
    await readFile(path.resolve(rootDir, 'package.json'), 'utf8')
  ) as {exports: Record<string, PackageExport>};

  return pkg.exports;
}

function asConditional(
  target: PackageExport,
  subpath: string
): ConditionalExport {
  if (typeof target === 'string') {
    throw new Error(`Expected a conditional export for ${subpath}`);
  }

  return target;
}

describe('getModules', () => {
  it('returns sorted module names', async () => {
    const modules = await getModules(rootDir, 'chains');

    expect(modules.length).toBeGreaterThan(0);
    expect(modules).toContain('btc');
    expect(modules).toEqual([...modules].sort());
  });

  it('treats a missing directory as empty', async () => {
    await expect(getModules(rootDir, 'missing')).resolves.toEqual([]);
  });

  it('propagates non-ENOENT filesystem errors', async () => {
    await expect(getModules(rootDir, 'index.ts')).rejects.toMatchObject({
      code: 'ENOTDIR',
    });
  });
});

describe('buildExports', () => {
  it('places types before default in every condition', () => {
    const exportsMap = buildExports(['btc', 'eth', 'usdt-erc20']);

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (subpath === './package.json') {
        expect(target).toBe('./package.json');
        continue;
      }

      const conditional = asConditional(target, subpath);
      expect(Object.keys(conditional.import)).toEqual(['types', 'default']);
      expect(Object.keys(conditional.require)).toEqual(['types', 'default']);
    }
  });

  it('maps every entry to the expected dist files', () => {
    const exportsMap = buildExports(['btc', 'usdt-erc20']);

    expect(exportsMap).toEqual({
      '.': {
        import: {types: './dist/index.d.mts', default: './dist/index.mjs'},
        require: {types: './dist/index.d.cts', default: './dist/index.cjs'},
      },
      './any': {
        import: {types: './dist/any.d.mts', default: './dist/any.mjs'},
        require: {types: './dist/any.d.cts', default: './dist/any.cjs'},
      },
      './btc': {
        import: {types: './dist/btc.d.mts', default: './dist/btc.mjs'},
        require: {types: './dist/btc.d.cts', default: './dist/btc.cjs'},
      },
      './usdt-erc20': {
        import: {
          types: './dist/usdt-erc20.d.mts',
          default: './dist/usdt-erc20.mjs',
        },
        require: {
          types: './dist/usdt-erc20.d.cts',
          default: './dist/usdt-erc20.cjs',
        },
      },
      './package.json': './package.json',
    });
  });

  it('produces the expected export map shape', () => {
    const shape = Object.entries(buildExports(['btc'])).map(
      ([subpath, target]) => {
        if (typeof target === 'string') {
          return `${subpath} -> ${target}`;
        }

        const importConditions = Object.keys(target.import).join(',');
        const requireConditions = Object.keys(target.require).join(',');
        return `${subpath} import:[${importConditions}] require:[${requireConditions}]`;
      }
    );

    expect(shape).toMatchInlineSnapshot(`
      [
        ". import:[types,default] require:[types,default]",
        "./any import:[types,default] require:[types,default]",
        "./btc import:[types,default] require:[types,default]",
        "./package.json -> ./package.json",
      ]
    `);
  });
});

describe('published package exports', () => {
  it('places types before default for every subpath', async () => {
    const exportsMap = await readPackageExports();

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (subpath === './package.json') {
        expect(target).toBe('./package.json');
        continue;
      }

      const conditional = asConditional(target, subpath);
      expect(Object.keys(conditional.import)).toEqual(['types', 'default']);
      expect(Object.keys(conditional.require)).toEqual(['types', 'default']);
    }
  });

  it('points every subpath at the matching dist files', async () => {
    const exportsMap = await readPackageExports();

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (subpath === './package.json') {
        expect(target).toBe('./package.json');
        continue;
      }

      const file = subpath === '.' ? 'index' : subpath.slice(2);
      expect(target).toEqual(conditions(file));
    }
  });

  it('matches the committed package.json exports', async () => {
    const exportsMap = await readPackageExports();
    const modules = [
      ...(await getModules(rootDir, 'chains')),
      ...(await getModules(rootDir, 'aliases')),
    ];

    expect(exportsMap).toEqual(buildExports(modules));
  });
});
