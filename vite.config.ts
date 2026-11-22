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
    },
    unbundle: true,
    clean: true,
    minify: true,
    // Keep the published package lean. Declaration maps would also point at
    // source files that are not part of the published tarball.
    sourcemap: false,
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
