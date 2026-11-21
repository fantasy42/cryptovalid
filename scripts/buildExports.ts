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

/**
 * Maps an entry name to its public package subpath.
 *
 * The root entry is named `index`; every other entry is exposed as
 * `./<name>`.
 *
 * @param name - Entry name from the manifest (e.g. `btc` or `index`).
 */
export function entrySubpath(name: string): string {
  return name === 'index' ? '.' : `./${name}`;
}

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
 * Every manifest entry is included: `index` becomes the root export and all
 * other names become `./<name>` subpaths.
 *
 * @param entries - Entry names from the manifest, in package order.
 */
export function buildExports(entries: readonly string[]): PackageExports {
  const exportsConfig: PackageExports = {};
  const seen = new Set<string>();

  for (const name of entries) {
    if (seen.has(name)) {
      throw new Error(`Duplicate export name "${name}".`);
    }

    seen.add(name);
    exportsConfig[entrySubpath(name)] = conditions(name);
  }

  exportsConfig['./package.json'] = './package.json';

  return exportsConfig;
}
