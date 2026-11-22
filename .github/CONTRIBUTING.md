# Contributing to cryptovalid

First off, thank you for considering contributing to `cryptovalid`! It is people like you who make this tool better for everyone.

For the public API, read the [README](../README.md). For repository invariants, code conventions, and the chain checklist, read [AGENTS.md](../AGENTS.md).

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:

   ```bash
   git clone https://github.com/your-username/cryptovalid.git
   cd cryptovalid
   ```

## Development Workflow

This project uses **Vite+**, a unified toolchain built on Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. It wraps runtime management, package management, and frontend tooling in a single CLI called `vp`.

Vite+ is distinct from Vite itself and invokes Vite underneath for commands like `vp dev` and `vp build`. Run `vp help`, or `vp <command> --help`, for details. Documentation is available locally at `node_modules/vite-plus/docs` or online at [viteplus.dev](https://viteplus.dev/guide/).

Always use `vp` commands for development, linting, testing, and packaging. Do not use `npm`, `pnpm`, `yarn`, or `bun` directly.

### Install

Development and CI run Node 24, pinned in `.node-version`. The published library supports Node.js 22.12+.

Run this after pulling remote changes and before getting started:

```bash
vp install
```

### Check and Format

Before submitting changes, ensure the code is formatted and passes linting and type checks:

```bash
vp check
```

Add `--fix` to autofix formatting issues.

### Test

Ensure existing tests pass, and add tests for new behavior:

```bash
vp test
```

Run one file with `vp test tests/btc.test.ts`.

### Build and Package Checks

The full build regenerates `package.json` exports, packs `dist`, and verifies the built declarations:

```bash
vp run build
```

Additional checks:

```bash
vp run check:entries   # manifest/source audit
vp run smoke           # built dist smoke test
```

To test the packed package in a clean consumer, build and pack first, then run the smoke script with the tarball path:

```bash
vp run build
vp pm pack
vp run smoke:package <tarball>
```

## Pull Request Process

Before opening a PR:

- Run `vp check` and `vp test`.
- Run `vp run build` if you changed source, the entry manifest, or generated exports.
- Add or update tests for every new or changed validator.
- If you added a chain, update `src/any/routes.ts`, `tests/any.test.ts`, the entry manifest, and the supported-chains table in `README.md`. The full checklist is in [AGENTS.md](../AGENTS.md).
- Update `README.md` if the public API changed.
- Do not hand-edit `package.json` exports; they are generated from `scripts/entries.ts`.

Then:

1. Create a branch for your change:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Commit with clear, descriptive messages.
3. Push the branch to your fork.
4. Open a pull request against the main repository.
5. Address review feedback.

## Reporting Issues

If you find a bug or have a feature request, search the issue tracker first. If it has not been reported, open a new issue with:

- A clear descriptive title.
- Steps to reproduce the issue (for bugs).
- Your environment details.

Security issues should follow the [Security Policy](SECURITY.md) instead of a public issue.

We appreciate your contributions and look forward to building this project together!
