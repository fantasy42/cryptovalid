# AGENTS.md

Instructions for coding agents working on `cryptovalid`. Keep this file short and actionable. The public API belongs in `README.md`; the human contribution workflow belongs in `.github/CONTRIBUTING.md`.

## What this repo is

`cryptovalid` is a TypeScript-first address validation library. It validates formats and checksums where applicable, exports a discriminated `ValidationResult`, ships ESM and CommonJS builds with types, and runs in Node.js 22.12+, browsers, workers, and edge runtimes.

The public surface is the chain validators and their batch variants, token aliases, the `validateAny` router on its own subpath, the exported result types, and stable error codes. Do not duplicate that catalog here; read `README.md` or `src/index.ts`.

## Commands

Use `vp` for everything. Do not use `npm`, `pnpm`, `yarn`, or `bun` directly.

- `vp install` - install dependencies after pulling changes.
- `vp check` - Oxlint, Oxfmt, and type checks. Add `--fix` to autofix.
- `vp test` - run the full suite. `vp test tests/btc.test.ts` runs one file.
- `vp run build` - regenerate exports, pack `dist`, and verify built declarations.
- `vp run check:entries` - audit `src/chains` and `src/aliases` against the entry manifest.
- `vp run smoke` - smoke-test the built `dist` in ESM and CJS.
- `vp run smoke:package <tarball>` - smoke-test a packed tarball in a clean consumer. Run `vp run build && vp pm pack` first; `dist` is not committed.

Development and CI run Node 24, pinned in `.node-version`. The published floor is `engines.node >=22.12.0`, tested against the packed tarball on Node 22.12, 24, and 26. Do not raise the runtime floor to the development floor without a major-version review.

Vite+ documentation is available at `node_modules/vite-plus/docs` or [viteplus.dev](https://viteplus.dev/guide/).

## Layout

```text
src/index.ts          root exports (every public entry except `any`)
src/chains/*.ts       one public entry per chain
src/aliases/*.ts      token aliases
src/any/              validateAny router; subpath-only
src/utils/            codecs, validator factories, prevalidation, address format predicates
src/constants.ts      stable error codes
scripts/entries.ts    entry manifest -> generated package.json exports
tests/                per-chain, router, and type-contract tests
```

## Invariants

1. `scripts/entries.ts` is the source of truth for build entries and generated `exports`. Never hand-edit `package.json` exports; edit the manifest and run `vp run build`. CI checks the generated diff.
2. `src/chains` and `src/aliases` are entry-only. Every public top-level `.ts` file there must be registered in the manifest. Co-located `*.test.ts` and `*.spec.ts` files are ignored; `index.ts` and `.d.ts` files are rejected. Put helpers in `src/utils` or a subdirectory.
3. `src/index.ts` must re-export every public entry except `any`, which is subpath-only. `scripts/entries.test.ts` enforces parity.
4. Every chain validator uses `createValidator`; every chain batch validator uses `createBatchValidator`. The router batch delegates to the shared `batch` helper. Shared input checks live in `src/utils/prevalidate.ts`: string, trimmed, non-empty, at most 256 characters, ASCII 32-126. Do not duplicate them.
5. `createValidator` owns `original`: it is the trimmed input when a string is supplied and `''` otherwise. The factory attaches and overrides it; the `ValidationOutcome` type disallows `original`, so validators cannot set it. Failure results use `ValidationErrorCodes` and a human-readable `message`. `code` is stable; `message` is not. Chain validators and their batch variants return the trimmed `original`; keep that behavior for new chain validators. On success, `address` is the validator's canonical form where one exists; otherwise it equals `original`.
6. Chain validators must not throw on malformed address input. `createValidator` catches exceptions and maps them to `INTERNAL_ERROR`. Batch functions expect an array of `BatchItem` values and throw `TypeError` for non-arrays. Malformed batch items are treated as empty strings and fail with `EMPTY`.
7. `validateAny` evaluates every route whose predicate matches; it does not short-circuit, so an address can be valid on multiple chains. Route predicates live in `src/utils/addressFormats.ts`; each predicate must accept every format the underlying validator accepts (a superset is fine). Routes are ordered specific-first: narrow prefix/length formats before broad shapes (notably Solana last) to keep a broad route's failure from masking a more specific one where formats are distinct. Prefix-only routes (notably Bitcoin and Litecoin Base58) can still overlap broad Base58 shapes; in that case `validateAny` reports the first matching route's failure. Overlapping predicates are expected; do not merge routes solely to avoid overlap. `evaluateRoutes` catches unexpected predicate/validator throws and returns `INTERNAL_ERROR`; `validateAny.address` is the first successful validator's address in route order. When adding or changing a format, update the predicate and add cross-chain tests.
8. The root `tsconfig.json` is a file-less solution (`files: []`) with shared compiler options. Do not populate `files` or add `include`. `tsconfig.lib.json` covers shipped source with no Node or DOM globals; `tsconfig.node.json` adds Node types for tests, scripts, and `vite.config.ts`. The build uses `tsconfig.lib.json`.
9. Checksum code (Base58Check, Bech32, EIP-55, CRC16) is security-critical. Changes require expanded reference vectors, a clear explanation of why validation is not weakened, and maintainer review. Adding an address type is compatible; rejecting previously valid addresses requires a major version.
10. Do not add runtime dependencies casually. The only current runtime dependency is `@noble/hashes`.

## Adding a Chain

1. Add `src/chains/<name>.ts` with an exported address type, `validate<Chain>`, `validate<Chain>Batch`, and JSDoc. Follow an existing chain file for structure.
2. Register it in `scripts/entries.ts` with a lowercase kebab-case name that matches the file name.
3. Re-export the values and types from `src/index.ts`.
4. Update the expected entry list in `scripts/entries.test.ts`.
5. Add a predicate to `src/utils/addressFormats.ts`, a route entry to `src/any/routes.ts`, and a chain name to `SupportedChain`. Order specific formats before broad ones; overlapping routes are fine because every matching route is evaluated.
6. Add `tests/<name>.test.ts` and cases in `tests/any.test.ts` for valid addresses, invalid addresses, and cross-chain isolation.
7. Update the supported-chains table in `README.md`.
8. Run `vp run check:entries`, `vp test`, and `vp run build`.

## Tests

- Chain tests live in `tests/*.test.ts`. Internal utility tests live in `src/utils/__tests__/`.
- Batch behavior is covered by the generic `src/utils/__tests__/batch.test.ts`. The router has `tests/any.test.ts`; all public result aliases (single-item and batch) and both no-`original` outcome branches are pinned in `tests/types.test.ts`.
- New validators need positive cases, negative cases (length, charset, checksum, wrong network), and edge cases (empty, whitespace, maximum length, leading zeros).
- Assert `result.code` and `result.message` on failure, not an `error` string. Assert `original` only where it documents trimming, case preservation, the factory-owned contract, or null input.
- Aim for 95% line coverage on validator and utility logic. Coverage is a target, not an enforced gate today.

## CI and Release

CI runs `vp check --deny-warnings`, `vp test`, `vp run build`, `vp run smoke`, and a packed-package consumer smoke. `setup-vp` already runs `vp install`; do not add a second install step.

Do not bump versions or publish manually. Run the `Release` workflow on `master`, choose `patch`/`minor`/`major`, and merge the release PR. The merge triggers the publish job; re-run the failed job if publishing fails. Details live in `.github/workflows/release.yml`.

## Docs

`README.md` is user-facing. Keep it accurate, concise, and free of internal implementation detail. Update it when the public API changes. Bundle-size and performance claims must state how they were measured and should be re-measured when dependencies change.
