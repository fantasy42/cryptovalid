import {defineConfig} from 'vite-plus';

import {ENTRIES} from './scripts/entries.ts';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  pack: {
    // The root tsconfig is a solution; the build must read the library project
    // so declaration emit sees the source files.
    tsconfig: './tsconfig.lib.json',
    // Runtime-neutral library: no Node-only resolution assumptions.
    platform: 'neutral',
    // Keep a browser-safe syntax floor, independent of engines.node.
    target: 'es2022',
    // A neutral platform otherwise defaults fixedExtension to false,
    // renaming outputs to .js/.d.ts and breaking the exports map.
    fixedExtension: true,
    entry: ENTRIES,
    format: ['esm', 'cjs'],
    dts: {
      generator: 'tsgo',
      // tsdown 0.23.4 appends a sourceMappingURL to declaration files when
      // `sourcemap` is enabled but only emits the matching .map files when
      // this option is set. Remove once Vite+ bundles tsdown >= 0.23.7.
      sourcemap: true,
    },
    unbundle: true,
    clean: true,
    minify: true,
    // Publish JavaScript source maps for both ESM and CJS outputs.
    sourcemap: true,
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
