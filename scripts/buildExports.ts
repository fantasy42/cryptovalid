import {promises as fs} from 'node:fs';
import path from 'node:path';

export interface ExportCondition {
  types: string;
  default: string;
}

export interface ConditionalExport {
  import: ExportCondition;
  require: ExportCondition;
}

export type PackageExport = ConditionalExport | string;
export type PackageExports = Record<string, PackageExport>;

const SPECIAL_EXPORTS = [
  {subpath: '.', file: 'index'},
  {subpath: './any', file: 'any'},
] as const;

/**
 * Builds the `import`/`require` conditions for a built entry.
 *
 * `types` must precede `default`: conditions are matched in object order, and
 * `default` always matches, so any condition placed after it is unreachable.
 *
 * @param file - Output basename in `dist` (e.g. `btc` or `usdt-erc20`).
 */
export function conditions(file: string): ConditionalExport {
  return {
    import: {
      types: `./dist/${file}.d.mts`,
      default: `./dist/${file}.mjs`,
    },
    require: {
      types: `./dist/${file}.d.cts`,
      default: `./dist/${file}.cjs`,
    },
  };
}

/**
 * Builds the complete `exports` map for the package.
 *
 * @param modules - Chain and alias output basenames (e.g. `btc`).
 */
export function buildExports(modules: readonly string[]): PackageExports {
  const exportsConfig: PackageExports = {};

  for (const {subpath, file} of SPECIAL_EXPORTS) {
    exportsConfig[subpath] = conditions(file);
  }

  for (const file of modules) {
    exportsConfig[`./${file}`] = conditions(file);
  }

  exportsConfig['./package.json'] = './package.json';

  return exportsConfig;
}

/**
 * Lists buildable module basenames in a source directory.
 *
 * Results are sorted so generated `exports` are deterministic across
 * filesystems. A missing directory is treated as empty; other filesystem
 * errors propagate instead of silently producing an empty export map.
 *
 * @param rootDir - Package root containing `src`.
 * @param dirName - Source directory to scan (e.g. `chains`).
 */
export async function getModules(
  rootDir: string,
  dirName: string
): Promise<string[]> {
  const dirPath = path.resolve(rootDir, 'src', dirName);

  try {
    const files = await fs.readdir(dirPath);
    return files
      .filter((file) => file.endsWith('.ts') && !file.includes('.test.'))
      .map((file) => path.parse(file).name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
