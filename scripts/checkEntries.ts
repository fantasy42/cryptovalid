import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {glob} from 'tinyglobby';

import {ENTRIES} from './entries.ts';

export interface EntryAuditIssue {
  kind: 'unlisted' | 'missing';
  file: string;
  message: string;
}

export interface EntryAuditOptions {
  rootDir: string;
  entries?: Readonly<Record<string, string>>;
  ignore?: readonly string[];
}

const AUDIT_PATTERNS = ['src/chains/*.ts', 'src/aliases/*.ts'] as const;

const DEFAULT_IGNORE = [
  'src/chains/*.test.ts',
  'src/aliases/*.test.ts',
  'src/chains/*.spec.ts',
  'src/aliases/*.spec.ts',
] as const;

const AUDITED_PREFIXES = ['src/chains/', 'src/aliases/'] as const;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT_DIR = path.resolve(SCRIPT_DIR, '..');

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function toRelativePath(rootDir: string, absolutePath: string): string {
  return toPosixPath(path.relative(rootDir, absolutePath));
}

function isAuditedPath(relativePath: string): boolean {
  return AUDITED_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

/**
 * Audits `src/chains` and `src/aliases` against the explicit entry manifest.
 *
 * The audit is bidirectional: it reports files that are not listed in the
 * manifest as well as listed files that are missing or not found by the
 * glob. This prevents a wrong working directory or a typo from producing a
 * false pass.
 *
 * @param options - Audit root, manifest, and ignore patterns.
 * @returns Sorted, human-readable audit issues.
 */
export async function auditEntries(
  options: EntryAuditOptions = {rootDir: DEFAULT_ROOT_DIR}
): Promise<EntryAuditIssue[]> {
  const {rootDir, entries = ENTRIES, ignore = DEFAULT_IGNORE} = options;

  const listedPaths = new Map<string, string>();

  for (const [name, entryPath] of Object.entries(entries)) {
    listedPaths.set(path.resolve(rootDir, entryPath), name);
  }

  const files = await glob([...AUDIT_PATTERNS], {
    cwd: rootDir,
    absolute: true,
    caseSensitiveMatch: false,
    ignore: [...ignore],
    onlyFiles: true,
  });

  const issues: EntryAuditIssue[] = [];
  const foundPaths = new Set<string>();

  for (const file of files) {
    const absoluteFile = path.resolve(file);

    if (foundPaths.has(absoluteFile)) {
      continue;
    }

    foundPaths.add(absoluteFile);

    if (listedPaths.has(absoluteFile)) {
      continue;
    }

    const relativeFile = toRelativePath(rootDir, absoluteFile);
    const basename = path.basename(absoluteFile);

    let reason = 'is not listed in scripts/entries.ts';
    let advice =
      'Add it to the manifest or move it out of src/chains or src/aliases.';

    if (basename.endsWith('.d.ts')) {
      reason = 'is a declaration file and cannot be an entry';
      advice = 'Move it out of src/chains or src/aliases.';
    } else if (basename === 'index.ts') {
      reason = 'is an index.ts helper and cannot be an entry';
      advice = 'Move it out of src/chains or src/aliases.';
    }

    issues.push({
      kind: 'unlisted',
      file: relativeFile,
      message: `${relativeFile} ${reason}. ${advice}`,
    });
  }

  for (const [absolutePath, name] of listedPaths) {
    const relativePath = toRelativePath(rootDir, absolutePath);
    const info = await stat(absolutePath).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
          return null;
        }

        throw error;
      }
    );

    if (!info) {
      issues.push({
        kind: 'missing',
        file: relativePath,
        message: `${relativePath} is listed as entry "${name}" but does not exist.`,
      });
      continue;
    }

    if (!info.isFile()) {
      issues.push({
        kind: 'missing',
        file: relativePath,
        message: `${relativePath} is listed as entry "${name}" but is not a regular file.`,
      });
      continue;
    }

    if (isAuditedPath(relativePath) && !foundPaths.has(absolutePath)) {
      issues.push({
        kind: 'missing',
        file: relativePath,
        message: `${relativePath} is listed as entry "${name}" but was not found by the entry audit. Check the audit root and ignore patterns.`,
      });
    }
  }

  issues.sort((left, right) =>
    left.file < right.file ? -1 : left.file > right.file ? 1 : 0
  );

  return issues;
}

async function main(): Promise<void> {
  const issues = await auditEntries();

  if (issues.length === 0) {
    console.log('✅ Entry manifest matches the chain and alias sources.');
    return;
  }

  for (const issue of issues) {
    console.error(`❌ ${issue.message}`);
  }

  process.exitCode = 1;
}

// `import.meta.main` is available in every Node version supported by Vite+.
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error('Failed to audit entry manifest:', error);
    process.exitCode = 1;
  }
}
