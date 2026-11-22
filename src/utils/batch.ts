import type {BatchItem, BatchResult} from '../types';

/**
 * Validates every address in `items` with the supplied validator.
 *
 * Processes all items (no short‑circuiting). Malformed or missing addresses
 * are converted to empty strings — the validator rejects them with `EMPTY`,
 * so no runtime errors are thrown. The validator's result is spread unchanged,
 * including its trimmed `original` field.
 *
 * `Array.from` is used instead of `map` so sparse-array holes are visited and
 * reported as empty addresses rather than disappearing from the results.
 *
 * @param validate - A single‑address validator (e.g., `validateBTC`).
 * @param items    - Addresses or {@link BatchItem} objects.
 * @returns Results in the same order as the input array.
 * @throws {TypeError} When `items` is not an array.
 */
export function batch<R extends {original: string}>(
  validate: (address: string) => R,
  items: readonly BatchItem[]
): BatchResult<R>[] {
  if (!Array.isArray(items)) {
    throw new TypeError('Expected an array of BatchItem values');
  }

  return Array.from(items, (item, index) => {
    const result = validate(toInputAddress(item));
    const id = toId(item);

    return {
      ...result,
      index,
      ...(id === undefined ? {} : {id}),
    };
  });
}

function toInputAddress(item: BatchItem): string {
  if (typeof item === 'string') {
    return item;
  }

  if (item != null && typeof item === 'object' && 'address' in item) {
    const address = (item as {address: unknown}).address;
    return typeof address === 'string' ? address : '';
  }

  return '';
}

function toId(item: BatchItem): string | number | undefined {
  if (typeof item === 'object' && item !== null && 'id' in item) {
    const id = (item as {id?: unknown}).id;

    if (typeof id === 'string' || typeof id === 'number') {
      return id;
    }
  }

  return undefined;
}
