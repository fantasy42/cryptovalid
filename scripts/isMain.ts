import path from 'node:path';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

/**
 * Resolves a path to its canonical form, following symlinks when possible.
 *
 * Node resolves a symlinked main module to its real path for `import.meta.url`
 * while `process.argv[1]` keeps the symlink, so comparing raw paths would miss
 * a symlinked entry point. Missing paths are compared as resolved paths.
 *
 * @param filePath - An absolute or cwd-relative path.
 * @returns The canonical path when it exists, otherwise the resolved path.
 */
function canonicalPath(filePath: string): string {
  const resolved = path.resolve(filePath);

  try {
    return realpathSync.native(resolved);
  } catch {
    return resolved;
  }
}

/**
 * Detects whether a module is the process entry point.
 *
 * `import.meta.main` is unavailable on Node.js versions that this package still
 * supports (it landed in Node.js 22.18), so scripts use this explicit check.
 *
 * @param moduleUrl - The importing module's `import.meta.url`.
 * @param entryPath - `process.argv[1]`, if present.
 * @returns `true` when the module is the process entry point.
 */
export function isMainModule(
  moduleUrl: string,
  entryPath: string | undefined
): boolean {
  if (entryPath === undefined) {
    return false;
  }

  const modulePath = canonicalPath(fileURLToPath(moduleUrl));
  const mainPath = canonicalPath(entryPath);

  return process.platform === 'win32'
    ? modulePath.toLowerCase() === mainPath.toLowerCase()
    : modulePath === mainPath;
}
