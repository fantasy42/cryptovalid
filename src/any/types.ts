import type {BatchResult, ValidationFailure} from '../types';

/**
 * Chain names returned by the omnibox router.
 */
export type SupportedChain =
  | 'Bitcoin'
  | 'Ethereum'
  | 'BNB'
  | 'Polygon'
  | 'Solana'
  | 'TRON'
  | 'Litecoin'
  | 'XRP'
  | 'Stellar'
  | 'TON';

/**
 * Discriminated union returned by the omnibox router.
 *
 * - `isValid: true` → the address is valid on at least one chain. The `chains`
 *   array lists every supported chain whose validator accepted the address.
 * - `isValid: false` → the address is invalid or the format is not recognized.
 *   Contains a machine‑readable `code` and human‑readable `message`.
 *
 * `original` is the input after surrounding whitespace is trimmed when a string
 * is supplied; it is `''` for non-string input. `address` is the normalized
 * address reported by the first successful validator in route order.
 *
 * The values in `chains` are {@link SupportedChain}; the field is typed as
 * `string[]` so adding the narrower chain-name type stays source-compatible
 * with earlier releases.
 */
export type AnyValidationResult =
  | {
      isValid: true;
      chains: string[];
      address: string;
      original: string;
    }
  | (ValidationFailure & {original: string});

/**
 * Validation result for a single address within a batch, using the omnibox router.
 *
 * Extends `AnyValidationResult` with the item’s position (`index`) and optional tracking `id`.
 */
export type AnyBatchValidationResult = BatchResult<AnyValidationResult>;
