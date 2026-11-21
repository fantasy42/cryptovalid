import {defineConfig} from 'vite-plus';

import {ENTRIES} from './scripts/entries.ts';

export default defineConfig({
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
    entry: ENTRIES,
    format: ['esm', 'cjs'],
    dts: {
      generator: 'tsgo',
    },
    unbundle: true,
    clean: true,
    treeshake: true,
    minify: true,
    publint: true,
    attw: {
      profile: 'node16',
      level: 'error',
    },
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
});
