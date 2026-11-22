import type {AnyBatchValidationResult, AnyValidationResult} from './types';
import type {BatchItem} from '../types';

import {ROUTES, evaluateRoutes} from './routes';
import {batch} from '../utils/batch';
import {prevalidate, toValidationFailure} from '../utils/prevalidate';

/**
 * Omnibox router – validates an address against all supported chains.
 *
 * Uses fast format predicates to narrow down candidate chains, then runs
 * strict checksum verification only on those candidates. Every matching route
 * is evaluated, so an address can be reported as valid on multiple chains.
 *
 * @param address - The address string to validate.
 * @returns An `AnyValidationResult` indicating success with all matching
 *          chain names, or failure with the first failure from the most
 *          specific matching route.
 */
export function validateAny(address: string): AnyValidationResult {
  const preResult = prevalidate(address);

  if (!preResult.ok) {
    return toValidationFailure(preResult);
  }

  return evaluateRoutes(preResult.value, ROUTES);
}

/**
 * Validates a batch of addresses through `validateAny`.
 *
 * Delegates to the shared {@link batch} helper, so item coercion, `original`,
 * `index`, `id`, and malformed-item handling match every other batch validator.
 *
 * @param items - Array of addresses or `BatchItem` objects.
 * @returns Array of `AnyBatchValidationResult`, preserving input order.
 */
export function validateAnyBatch(
  items: readonly BatchItem[]
): AnyBatchValidationResult[] {
  return batch(validateAny, items);
}

export type * from './types';
