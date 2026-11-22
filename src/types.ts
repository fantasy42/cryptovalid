import type {ValidationErrorCode} from './constants';

/**
 * A successful validation, before the shared `original` field is attached.
 *
 * @template T - The detected address type (e.g. `'Bech32'`, `'Ethereum'`).
 */
export type ValidationSuccess<T extends string> = {
  isValid: true;
  type: T;
  address: string;
};

/**
 * A failed validation, before the shared `original` field is attached.
 */
export type ValidationFailure = {
  isValid: false;
  code: ValidationErrorCode;
  message: string;
};

/**
 * Discriminated union for validation outcomes.
 *
 * - `isValid: true` → successful validation with normalized address, detected type, and the trimmed input.
 * - `isValid: false` → validation failed with a machine‑readable `code`, a human‑readable `message`, and the trimmed input.
 *
 * `original` is the input after surrounding whitespace is trimmed when a string
 * is supplied; it is `''` for non-string input. The validator factory owns this
 * field; individual validators do not set it.
 *
 * @template T - The detected address type (e.g. `'Bech32'`, `'Ethereum'`).
 */
export type ValidationResult<T extends string = string> =
  | (ValidationSuccess<T> & {original: string})
  | (ValidationFailure & {original: string});

/**
 * A batch validation input.
 *
 * Accepts a plain address string or an object with an address and an optional
 * id for mapping results back to UI fields. At runtime only string and number
 * ids are preserved; other values are ignored.
 */
export type BatchItem = string | {address: string; id?: string | number};

/**
 * Adds batch metadata to a single validation result.
 *
 * The validator's result is spread as-is, so its `original` field is preserved
 * rather than recomputed by the batch layer.
 *
 * @template R - The single-item result type.
 */
export type BatchResult<R> = R & {index: number; id?: string | number};

/**
 * Validation result for a single address within a batch.
 *
 * Extends {@link ValidationResult} with the item’s position in the input array
 * and an optional tracking `id`.
 *
 * @template T - The detected address type (e.g., `'Bech32'`, `'Ethereum'`).
 */
export type BatchValidationResult<T extends string = string> = BatchResult<
  ValidationResult<T>
>;
