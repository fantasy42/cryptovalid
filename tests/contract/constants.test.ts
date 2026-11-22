import type {ValidationErrorCode} from '../../src/constants';
import type {ValidationErrorCode as RootValidationErrorCode} from '../../src/index';

import {describe, expect, expectTypeOf, it} from 'vite-plus/test';

import {ValidationErrorCodes} from '../../src/constants';
import {ValidationErrorCodes as RootValidationErrorCodes} from '../../src/index';

const expectedCodes = {
  NULL_OR_UNDEFINED: 'NULL_OR_UNDEFINED',
  EMPTY: 'EMPTY',
  TOO_LONG: 'TOO_LONG',
  INVALID_CHARACTERS: 'INVALID_CHARACTERS',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_PREFIX: 'INVALID_PREFIX',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_CHECKSUM: 'INVALID_CHECKSUM',
  INVALID_VERSION: 'INVALID_VERSION',
  INVALID_ENCODING: 'INVALID_ENCODING',
  MIXED_CASE: 'MIXED_CASE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type ExpectedCode = (typeof expectedCodes)[keyof typeof expectedCodes];

describe('ValidationErrorCodes', () => {
  it('exposes the exact public error-code map', () => {
    expect(ValidationErrorCodes).toStrictEqual(expectedCodes);
  });

  it('keeps the public code union narrow', () => {
    expectTypeOf<ValidationErrorCode>().toEqualTypeOf<ExpectedCode>();
  });

  it('re-exports the same error-code API from the root entry', () => {
    expect(RootValidationErrorCodes).toBe(ValidationErrorCodes);
    expectTypeOf<RootValidationErrorCode>().toEqualTypeOf<ExpectedCode>();
  });
});
