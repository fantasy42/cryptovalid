import type {ConditionalExport, PackageExport} from './buildExports.ts';

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vite-plus/test';

import {buildExports, conditions, entrySubpath} from './buildExports.ts';
import {ENTRIES} from './entries.ts';

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

describe('entrySubpath', () => {
  it('maps the root entry to .', () => {
    expect(entrySubpath('index')).toBe('.');
  });

  it('maps every other entry to a subpath', () => {
    expect(entrySubpath('any')).toBe('./any');
    expect(entrySubpath('btc')).toBe('./btc');
    expect(entrySubpath('usdt-erc20')).toBe('./usdt-erc20');
  });
});

describe('buildExports', () => {
  it('places types before default in every condition', () => {
    const exportsMap = buildExports(['index', 'any', 'btc', 'usdt-erc20']);

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
    const exportsMap = buildExports(['index', 'any', 'btc', 'usdt-erc20']);

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

  it('returns only the package.json export when there are no entries', () => {
    expect(buildExports([])).toEqual({'./package.json': './package.json'});
  });

  it('does not emit a ./index subpath', () => {
    const exportsMap = buildExports(['index', 'btc']);

    expect(exportsMap).not.toHaveProperty('./index');
    expect(exportsMap).toHaveProperty('.');
  });

  it('rejects duplicate entry names', () => {
    expect(() => buildExports(['index', 'btc', 'btc'])).toThrow(
      /Duplicate export name "btc"/
    );
  });

  it('produces the expected export map shape', () => {
    const shape = Object.entries(buildExports(['index', 'any', 'btc'])).map(
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

  it('does not contain a ./index subpath', async () => {
    const exportsMap = await readPackageExports();

    expect(exportsMap).not.toHaveProperty('./index');
  });

  it('matches the committed package.json exports', async () => {
    const exportsMap = await readPackageExports();

    expect(exportsMap).toEqual(buildExports(Object.keys(ENTRIES)));
  });
});
