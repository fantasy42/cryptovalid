import type {ValidationErrorCode} from '../constants';
import type {ValidationFailure} from '../types';

import {ValidationErrorCodes} from '../constants';

export type PrevalidateResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      code: ValidationErrorCode;
      message: string;
      original: string;
    };

export type PrevalidateFailure = Extract<PrevalidateResult, {ok: false}>;

const MAX_ADDRESS_LENGTH = 256;

/**
 * Performs early input checks on a raw address value.
 *
 * Validates that the input is a non‑empty, printable ASCII string
 * no longer than 256 characters. Returns a discriminated result.
 */
export function prevalidate(raw: unknown): PrevalidateResult {
  if (raw == null || typeof raw !== 'string') {
    return {
      ok: false,
      code: ValidationErrorCodes.NULL_OR_UNDEFINED,
      message: 'Address must be a non-empty string',
      original: '',
    };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      code: ValidationErrorCodes.EMPTY,
      message: 'Address must not be empty or whitespace',
      original: trimmed,
    };
  }

  if (trimmed.length > MAX_ADDRESS_LENGTH) {
    return {
      ok: false,
      code: ValidationErrorCodes.TOO_LONG,
      message: `Address exceeds maximum length of ${MAX_ADDRESS_LENGTH} characters`,
      original: trimmed,
    };
  }

  // ASCII printable only (codes 32–126)
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code < 32 || code > 126) {
      return {
        ok: false,
        code: ValidationErrorCodes.INVALID_CHARACTERS,
        message: 'Address contains invalid characters',
        original: trimmed,
      };
    }
  }

  return {ok: true, value: trimmed};
}

/**
 * Converts a prevalidation failure into the shared failure result shape.
 *
 * Both `createValidator` and the router use this so prevalidation failures
 * keep the same `isValid`, `code`, `message`, and `original` fields.
 */
export function toValidationFailure(
  failure: PrevalidateFailure
): ValidationFailure & {original: string} {
  return {
    isValid: false,
    code: failure.code,
    message: failure.message,
    original: failure.original,
  };
}
