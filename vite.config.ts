import {glob} from 'tinyglobby';
import path from 'node:path';

async function getEntries() {
  const files = await glob([
    'src/chains/*.ts',
    'src/aliases/*.ts',
    '!src/**/*.test.ts',
  ]);

  const entries: Record<string, string> = {};
  const seen = new Set<string>();

  for (const file of files) {
    const name = path.parse(file).name;
    if (seen.has(name)) {
      throw new Error(
        `Duplicate entry name "${name}" from files: ${entries[name]} and ${file}. Rename one of the source files.`
      );
    }

    seen.add(name);
    entries[name] = file;
  }

  return entries;
}

const entries = await getEntries();

export default {
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  staged: {
    '*': 'vp check --fix',
  },
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    entry: {
      index: 'src/index.ts',
      any: 'src/any/index.ts',
      ...entries,
    },
    format: ['esm', 'cjs'],
    dts: {
      generator: 'tsgo',
    },
    unbundle: true,
    clean: true,
    treeshake: true,
    minify: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    trailingComma: 'es5',
    semi: true,
    printWidth: 80,
    singleQuote: true,
    bracketSpacing: false,
    ignorePatterns: ['*.yml', '*.md'],
  },
};
