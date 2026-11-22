import path from 'node:path';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vite-plus/test';

import {
  ENTRIES,
  ROOT_EXCLUDED_ENTRIES,
  defineEntries,
  validateEntries,
} from './entries.ts';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const validEntries = {
  index: 'src/index.ts',
  any: 'src/any/index.ts',
  constants: 'src/constants.ts',
  btc: 'src/chains/btc.ts',
  'usdt-erc20': 'src/aliases/usdt-erc20.ts',
};

const ROOT_NON_ENTRY_TYPE_SPECIFIERS = ['types'] as const;

const invalidManifests: Array<[string, unknown]> = [
  ['null', null],
  ['an array', []],
  ['a Map', new Map()],
  ['a Date', new Date()],
];

const EXPORT_FROM_PATTERN =
  /^[ \t]*export\s+(?<typeOnly>type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+['"](?<specifier>[^'"]+)['"]/gm;

function normalizeSpecifier(specifier: string): string {
  return specifier.replace(/^\.\//, '').replace(/\.ts$/, '');
}

function entrySpecifier(entryPath: string): string {
  return entryPath.replace(/^src\//, '').replace(/\.ts$/, '');
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

describe('ENTRIES', () => {
  it('lists the public entries in package order', () => {
    expect(Object.keys(ENTRIES)).toEqual([
      'index',
      'any',
      'constants',
      'bnb',
      'btc',
      'eth',
      'ltc',
      'polygon',
      'sol',
      'ton',
      'trx',
      'xlm',
      'xrp',
      'usdt-bep20',
      'usdt-erc20',
      'usdt-trc20',
    ]);
  });

  it('pins the fixed entries', () => {
    expect(ENTRIES.index).toBe('src/index.ts');
    expect(ENTRIES.any).toBe('src/any/index.ts');
    expect(ENTRIES.constants).toBe('src/constants.ts');
  });

  it('excludes only any from the root entry point', () => {
    expect([...ROOT_EXCLUDED_ENTRIES]).toEqual(['any']);
  });

  it('is valid under the manifest rules', () => {
    expect(validateEntries(ENTRIES)).toEqual([]);
  });
});

describe('validateEntries', () => {
  it('accepts a valid manifest', () => {
    expect(validateEntries(validEntries)).toEqual([]);
  });

  it('requires the root entry', () => {
    const withoutIndex = Object.fromEntries(
      Object.entries(validEntries).filter(([name]) => name !== 'index')
    );

    expect(validateEntries(withoutIndex)).toContain(
      'Missing required entry "index".'
    );
  });

  it('requires the router entry', () => {
    const withoutAny = Object.fromEntries(
      Object.entries(validEntries).filter(([name]) => name !== 'any')
    );

    expect(validateEntries(withoutAny)).toContain(
      'Missing required entry "any".'
    );
  });

  it('requires the constants entry', () => {
    const withoutConstants = Object.fromEntries(
      Object.entries(validEntries).filter(([name]) => name !== 'constants')
    );

    expect(validateEntries(withoutConstants)).toContain(
      'Missing required entry "constants".'
    );
  });

  it('rejects the root entry pointing at a chain index', () => {
    expect(
      validateEntries({...validEntries, index: 'src/chains/index.ts'})
    ).toContain(
      'Reserved entry "index" must map to "src/index.ts", not "src/chains/index.ts".'
    );
  });

  it('rejects the router entry pointing at an alias any', () => {
    expect(
      validateEntries({...validEntries, any: 'src/aliases/any.ts'})
    ).toContain(
      'Reserved entry "any" must map to "src/any/index.ts", not "src/aliases/any.ts".'
    );
  });

  it('rejects an index.ts helper under another name', () => {
    expect(
      validateEntries({...validEntries, helper: 'src/chains/index.ts'})
    ).toContain(
      'Entry "helper" must map to "src/chains/helper.ts" or "src/aliases/helper.ts".'
    );
  });

  it('rejects declaration files', () => {
    expect(
      validateEntries({...validEntries, helper: 'src/chains/helper.d.ts'})
    ).toContain(
      'Entry "helper" points to a declaration file "src/chains/helper.d.ts"; entries must be .ts modules.'
    );
  });

  it('rejects duplicate names case-insensitively', () => {
    expect(
      validateEntries({...validEntries, BTC: 'src/chains/BTC.ts'})
    ).toContain('Duplicate entry name "BTC" (names are case-insensitive).');
  });

  it('rejects duplicate paths', () => {
    expect(
      validateEntries({...validEntries, bitcoin: 'src/chains/btc.ts'})
    ).toContain('Duplicate entry path "src/chains/btc.ts".');
  });

  it.each(['BTC', 'usdt_erc20', 'foo.bar', 'foo bar'])(
    'rejects non-kebab-case name %s',
    (name) => {
      expect(
        validateEntries({...validEntries, [name]: `src/chains/${name}.ts`})
      ).toContain(
        `Entry name "${name}" must be lowercase kebab-case (for example, "usdt-erc20").`
      );
    }
  );

  it('rejects reserved internal name types', () => {
    expect(
      validateEntries({...validEntries, types: 'src/chains/types.ts'})
    ).toContain(
      'Entry name "types" is reserved by a top-level internal module; choose another name.'
    );
  });

  it('rejects the constants entry pointing at a chain source', () => {
    expect(
      validateEntries({...validEntries, constants: 'src/chains/constants.ts'})
    ).toContain(
      'Reserved entry "constants" must map to "src/constants.ts", not "src/chains/constants.ts".'
    );
  });

  it('rejects paths outside chains and aliases', () => {
    expect(
      validateEntries({...validEntries, evil: '../src/chains/evil.ts'})
    ).toContain(
      'Entry "evil" must map to "src/chains/evil.ts" or "src/aliases/evil.ts".'
    );
  });

  it('rejects a path that does not match the entry name', () => {
    expect(
      validateEntries({...validEntries, btc: 'src/chains/eth.ts'})
    ).toContain(
      'Entry "btc" must map to "src/chains/btc.ts" or "src/aliases/btc.ts".'
    );
  });

  it.each(invalidManifests)('rejects %s as a manifest', (_label, value) => {
    expect(validateEntries(value as Readonly<Record<string, unknown>>)).toEqual(
      ['Entry manifest must be a plain object.']
    );
  });

  it('rejects empty manifests', () => {
    expect(validateEntries({})).toEqual(
      expect.arrayContaining([
        'Missing required entry "index".',
        'Missing required entry "any".',
      ])
    );
  });

  it('returns the same manifest from defineEntries', () => {
    expect(defineEntries(validEntries)).toBe(validEntries);
  });

  it('throws for an invalid manifest', () => {
    expect(() =>
      defineEntries({...validEntries, constants: 'src/chains/constants.ts'})
    ).toThrow(/Invalid entry manifest/);
  });
});

describe('src/index.ts parity', () => {
  it('re-exports exactly the public value and type modules', async () => {
    const source = await readFile(path.join(rootDir, 'src/index.ts'), 'utf8');
    const clauses = [...source.matchAll(EXPORT_FROM_PATTERN)].map((match) => ({
      isTypeOnly: Boolean(match[1]),
      specifier: normalizeSpecifier(match[2]),
    }));

    const publicSpecifiers = Object.entries(ENTRIES)
      .filter(([name]) => name !== 'index' && !ROOT_EXCLUDED_ENTRIES.has(name))
      .map(([, entryPath]) => entrySpecifier(entryPath));

    // The root uses one explicit value clause and one `export type *` clause
    // per public entry; `types` is the only non-entry module.
    const valueSpecifiers = clauses
      .filter((clause) => !clause.isTypeOnly)
      .map((clause) => clause.specifier);
    const typeSpecifiers = clauses
      .filter((clause) => clause.isTypeOnly)
      .map((clause) => clause.specifier);

    expect(uniqueSorted(valueSpecifiers)).toEqual(
      uniqueSorted(publicSpecifiers)
    );
    expect(uniqueSorted(typeSpecifiers)).toEqual(
      uniqueSorted([...publicSpecifiers, ...ROOT_NON_ENTRY_TYPE_SPECIFIERS])
    );
  });

  it('re-exports exactly the public entry values from the root', async () => {
    const root = (await import('../src/index.ts')) as Record<string, unknown>;
    const expectedKeys = new Set(['ValidationErrorCodes']);

    for (const [name, entryPath] of Object.entries(ENTRIES)) {
      if (name === 'index' || ROOT_EXCLUDED_ENTRIES.has(name)) {
        continue;
      }

      const module = (await import(
        /* @vite-ignore */ `../${entryPath}`
      )) as Record<string, unknown>;

      for (const key of Object.keys(module)) {
        expectedKeys.add(key);
        expect(root, `Missing root export "${key}"`).toHaveProperty(key);
        expect(root[key], `Root export "${key}" must match its entry`).toBe(
          module[key]
        );
      }
    }

    expect(Object.keys(root).sort()).toEqual([...expectedKeys].sort());
    expect(root).not.toHaveProperty('validateAny');
    expect(root).not.toHaveProperty('validateAnyBatch');
  });
});

describe('repository invariants', () => {
  it('only reuses a top-level module name when the entry maps to it', async () => {
    const sourceFiles = await readdir(path.join(rootDir, 'src'), {
      withFileTypes: true,
    });
    const topLevelNames = sourceFiles
      .filter((file) => file.isFile())
      .map((file) => file.name.toLowerCase())
      .filter(
        (file) =>
          file.endsWith('.ts') &&
          !file.endsWith('.d.ts') &&
          !file.endsWith('.test.ts') &&
          !file.endsWith('.spec.ts')
      )
      .map((file) => path.parse(file).name);

    for (const [name, entryPath] of Object.entries(ENTRIES)) {
      const loweredName = name.toLowerCase();

      if (loweredName === 'index') {
        continue;
      }

      if (topLevelNames.includes(loweredName)) {
        expect(
          entryPath,
          `Entry "${name}" must map to src/${name}.ts when a top-level module with that name exists`
        ).toBe(`src/${name}.ts`);
      }
    }
  });
});
