/**
 * Explicit public entry manifest.
 *
 * This is the single source of truth for the library's build entries and the
 * generated `package.json` exports. Keep `src/index.ts` in sync with the
 * entries listed here; `scripts/entries.test.ts` enforces that parity.
 */

export interface EntryManifest {
  index: string;
  any: string;
  readonly [name: string]: string;
}

const FIXED_ENTRIES = {
  index: 'src/index.ts',
  any: 'src/any/index.ts',
} as const;

/**
 * Names reserved by top-level internal modules.
 *
 * With `unbundle` enabled, `src/constants.ts` and `src/types.ts` emit
 * `dist/constants.*` and `dist/types.d.*`. A public entry with either name
 * would collide with those chunks and can make the generated `exports` point
 * at the wrong module or declaration.
 *
 * `scripts/entries.test.ts` also compares every top-level `src/*.ts` module
 * with the manifest, so a new internal module cannot silently collide with a
 * future entry name.
 */
const RESERVED_INTERNAL_NAMES = new Set(['constants', 'types']);

const ENTRY_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Entries that are intentionally available only as subpaths, never from the
 * root entry point.
 */
export const ROOT_EXCLUDED_ENTRIES: ReadonlySet<string> = new Set(['any']);

/**
 * Validates a manifest without touching the filesystem.
 *
 * @param entries - Candidate manifest to validate.
 * @returns A list of human-readable validation errors, empty when valid.
 */
export function validateEntries(
  entries: Readonly<Record<string, unknown>>
): string[] {
  if (
    entries === null ||
    typeof entries !== 'object' ||
    Array.isArray(entries)
  ) {
    return ['Entry manifest must be a plain object.'];
  }

  const prototype = Object.getPrototypeOf(entries);
  if (prototype !== Object.prototype && prototype !== null) {
    return ['Entry manifest must be a plain object.'];
  }

  const errors: string[] = [];
  const records = entries as Readonly<Record<string, unknown>>;
  const seenNames = new Set<string>();
  const seenPaths = new Set<string>();

  for (const required of Object.keys(FIXED_ENTRIES)) {
    if (!Object.hasOwn(records, required)) {
      errors.push(`Missing required entry "${required}".`);
    }
  }

  for (const [name, value] of Object.entries(records)) {
    const loweredName = name.toLowerCase();
    if (seenNames.has(loweredName)) {
      errors.push(
        `Duplicate entry name "${name}" (names are case-insensitive).`
      );
    }
    seenNames.add(loweredName);

    if (typeof value !== 'string' || value.length === 0) {
      errors.push(`Entry "${name}" must map to a non-empty source path.`);
      continue;
    }

    if (value.endsWith('.d.ts')) {
      errors.push(
        `Entry "${name}" points to a declaration file "${value}"; entries must be .ts modules.`
      );
      continue;
    }

    const loweredPath = value.toLowerCase();
    if (seenPaths.has(loweredPath)) {
      errors.push(`Duplicate entry path "${value}".`);
    }
    seenPaths.add(loweredPath);

    if (name === 'index' || name === 'any') {
      if (value !== FIXED_ENTRIES[name]) {
        errors.push(
          `Reserved entry "${name}" must map to "${FIXED_ENTRIES[name]}", not "${value}".`
        );
      }
      continue;
    }

    if (RESERVED_INTERNAL_NAMES.has(name)) {
      errors.push(
        `Entry name "${name}" is reserved by a top-level internal module; choose another name.`
      );
      continue;
    }

    if (!ENTRY_NAME_PATTERN.test(name)) {
      errors.push(
        `Entry name "${name}" must be lowercase kebab-case (for example, "usdt-erc20").`
      );
      continue;
    }

    const allowedPaths = [`src/chains/${name}.ts`, `src/aliases/${name}.ts`];

    if (!allowedPaths.includes(value)) {
      errors.push(
        `Entry "${name}" must map to "${allowedPaths[0]}" or "${allowedPaths[1]}".`
      );
    }
  }

  for (const excluded of ROOT_EXCLUDED_ENTRIES) {
    if (
      !Object.hasOwn(records, excluded) &&
      !Object.hasOwn(FIXED_ENTRIES, excluded)
    ) {
      errors.push(
        `Entry "${excluded}" is root-excluded but missing from the manifest.`
      );
    }
  }

  return errors;
}

/**
 * Defines and validates the public entry manifest.
 *
 * Validation runs when this module is imported, so build configuration,
 * export generation, and tests fail before any files are written.
 *
 * @param entries - Manifest to validate and return.
 * @returns The same manifest, with literal entry names preserved.
 */
export function defineEntries<const T extends EntryManifest>(entries: T): T {
  const errors = validateEntries(entries);

  if (errors.length > 0) {
    throw new Error(
      `Invalid entry manifest:\n${errors
        .map((error) => `- ${error}`)
        .join('\n')}`
    );
  }

  return entries;
}

/**
 * Public entry points, in generated-`exports` order.
 *
 * `index` is the root entry. `any` is built and published as
 * `cryptovalid/any` but intentionally not re-exported from the root entry.
 */
export const ENTRIES = defineEntries({
  index: 'src/index.ts',
  any: 'src/any/index.ts',
  bnb: 'src/chains/bnb.ts',
  btc: 'src/chains/btc.ts',
  eth: 'src/chains/eth.ts',
  ltc: 'src/chains/ltc.ts',
  polygon: 'src/chains/polygon.ts',
  sol: 'src/chains/sol.ts',
  ton: 'src/chains/ton.ts',
  trx: 'src/chains/trx.ts',
  xlm: 'src/chains/xlm.ts',
  xrp: 'src/chains/xrp.ts',
  'usdt-bep20': 'src/aliases/usdt-bep20.ts',
  'usdt-erc20': 'src/aliases/usdt-erc20.ts',
  'usdt-trc20': 'src/aliases/usdt-trc20.ts',
});
