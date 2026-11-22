import {randomUUID} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildExports} from './buildExports.ts';
import {ENTRIES} from './entries.ts';
import {isMainModule} from './isMain.ts';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT_DIR = path.resolve(SCRIPT_DIR, '..');

export interface GenerateExportsOptions {
  /** Directory containing the package.json to update. */
  rootDir?: string;
  /** Entry names to turn into public exports. */
  entries?: readonly string[];
}

export interface GenerateExportsResult {
  /** `true` when package.json was rewritten, `false` when it was in sync. */
  changed: boolean;
  /** Absolute path of the package.json that was checked. */
  pkgPath: string;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Generates the package `exports` map from the entry manifest.
 *
 * The write is skipped when the serialized result is already up to date, and
 * is otherwise performed atomically through a temporary file in the same
 * directory, so an interrupted run cannot leave a truncated package.json.
 *
 * @param options - Directory and entry names to generate from.
 * @returns Whether package.json changed and the path that was checked.
 */
export async function generateExports(
  options: GenerateExportsOptions = {}
): Promise<GenerateExportsResult> {
  const {rootDir = DEFAULT_ROOT_DIR, entries = Object.keys(ENTRIES)} = options;
  const pkgPath = path.resolve(rootDir, 'package.json');

  try {
    const pkgStr = await fs.readFile(pkgPath, 'utf8');
    const pkg: unknown = JSON.parse(pkgStr);

    if (!isJsonObject(pkg)) {
      throw new Error('package.json must contain a JSON object.');
    }

    pkg.exports = buildExports(entries);

    const nextPkgStr = `${JSON.stringify(pkg, null, 2)}\n`;

    if (nextPkgStr === pkgStr) {
      return {changed: false, pkgPath};
    }

    const tempPath = path.join(
      path.dirname(pkgPath),
      `.package.json.${randomUUID()}.tmp`
    );

    try {
      await fs.writeFile(tempPath, nextPkgStr, 'utf8');
      await fs.rename(tempPath, pkgPath);
    } catch (error) {
      await fs.rm(tempPath, {force: true}).catch(() => undefined);
      throw error;
    }

    return {changed: true, pkgPath};
  } catch (error) {
    throw new Error(`Failed to generate exports in ${pkgPath}`, {cause: error});
  }
}

async function main(): Promise<void> {
  const {changed} = await generateExports();

  console.log(
    changed
      ? '✅ Generated named exports in package.json'
      : '✅ package.json exports are already up to date'
  );
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
