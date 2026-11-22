import type {
  ValidationFailure,
  ValidationResult,
  ValidationSuccess,
} from '../types';

import {prevalidate, toValidationFailure} from './prevalidate';
import {ValidationErrorCodes} from '../constants';

/**
 * The shape a validator callback returns. It intentionally has no `original`
 * field: the factory owns that field and attaches the trimmed input.
 *
 * The optional `never` makes that a type-level guarantee rather than a
 * convention, so a validator cannot return a full `ValidationResult`.
 *
 * @template T - The detected address type.
 */
export type ValidationOutcome<T extends string> =
  | (ValidationSuccess<T> & {original?: never})
  | (ValidationFailure & {original?: never});

/**
 * Helper methods for building a {@link ValidationOutcome} inside a validator.
 *
 * @template T - The detected address type.
 */
export interface ValidationContext<T extends string = string> {
  success: (params: {type: T; address: string}) => ValidationSuccess<T>;
  failure: (params: {
    code: ValidationFailure['code'];
    message: string;
  }) => ValidationFailure;
}

/**
 * Wraps a validation function with common input checks and error handling.
 *
 * The factory trims the input, performs the shared prevalidation checks, and
 * attaches the trimmed input as `original` (or `''` for non-string input) on
 * every result. Validator callbacks only choose the success payload or failure
 * code/message.
 *
 * @param validate - A validation callback that receives the cleaned address
 *                   and a {@link ValidationContext}.
 * @returns A type‑safe address validator that never throws.
 */
export function createValidator<T extends string>(
  validate: (
    address: string,
    context: ValidationContext<T>
  ) => ValidationOutcome<T>
): (address: string) => ValidationResult<T> {
  const context: ValidationContext<T> = {
    success: ({type, address}) => ({isValid: true, type, address}),
    failure: ({code, message}) => ({isValid: false, code, message}),
  };

  return (address: string): ValidationResult<T> => {
    const preResult = prevalidate(address);
    if (!preResult.ok) {
      return toValidationFailure(preResult);
    }

    try {
      const outcome = validate(preResult.value, context);
      return {...outcome, original: preResult.value};
    } catch {
      return {
        isValid: false,
        code: ValidationErrorCodes.INTERNAL_ERROR,
        message: 'Internal validation error',
        original: preResult.value,
      };
    }
  };
}
