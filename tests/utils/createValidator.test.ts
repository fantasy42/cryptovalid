import type {ValidationContext} from '../../src/utils/createValidator';

import {describe, it, expect, vi} from 'vite-plus/test';

import {createValidator} from '../../src/utils/createValidator';
import {ValidationErrorCodes} from '../../src/constants';

describe('createValidator factory', () => {
  const validAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

  it('passes a valid string through to the inner validator', () => {
    const result = alwaysSuccessValidator(validAddress);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.type).toBe('test');
      expect(result.original).toBe(validAddress);
    }
  });

  it('trims whitespace before calling inner validator', () => {
    const spy = vi.fn((addr: string, ctx: ValidationContext<'test'>) =>
      ctx.success({type: 'test', address: addr})
    );
    const validator = createValidator<'test'>(spy);
    validator('   ' + validAddress + '   ');
    expect(spy).toHaveBeenCalledWith(validAddress, expect.any(Object));
  });

  it('sets original to the trimmed input on success', () => {
    const result = alwaysSuccessValidator('   ' + validAddress + '   ');
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.original).toBe(validAddress);
    }
  });

  it('overrides any original supplied by the inner validator', () => {
    const validator = createValidator<'test'>(
      (address) =>
        ({
          isValid: true,
          type: 'test',
          address,
          original: 'wrong',
        }) as any
    );
    const result = validator('  right  ');
    expect(result.isValid).toBe(true);
    if (result.isValid) expect(result.original).toBe('right');
  });

  it('overrides any original supplied on a failure payload', () => {
    const validator = createValidator<'test'>(
      () =>
        ({
          isValid: false,
          code: ValidationErrorCodes.INVALID_FORMAT,
          message: 'bad',
          original: 'wrong',
        }) as any
    );
    const result = validator('  right  ');
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.INVALID_FORMAT);
      expect(result.original).toBe('right');
    }
  });

  it('delegates null/undefined to prevalidate (returns NULL_OR_UNDEFINED)', () => {
    const result = alwaysSuccessValidator(null as any);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.NULL_OR_UNDEFINED);
      expect(result.original).toBe('');
    }
  });

  it('delegates empty/whitespace to prevalidate (returns EMPTY)', () => {
    const result = alwaysSuccessValidator('   ');
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.EMPTY);
      expect(result.original).toBe('');
    }
  });

  it('delegates too‑long to prevalidate (returns TOO_LONG)', () => {
    const result = alwaysSuccessValidator('0x' + 'a'.repeat(257));
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.TOO_LONG);
    }
  });

  it('keeps the trimmed original on a prevalidation failure', () => {
    const long = 'a'.repeat(257);
    const result = alwaysSuccessValidator(`  ${long}  `);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.TOO_LONG);
      expect(result.original).toBe(long);
    }
  });

  it('delegates invalid characters to prevalidate (returns INVALID_CHARACTERS)', () => {
    const result = alwaysSuccessValidator('0x1234\x00abcd');
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.INVALID_CHARACTERS);
    }
  });

  it('does not call the inner validator when prevalidation fails', () => {
    const spy = vi.fn((addr: string, ctx: ValidationContext<'test'>) =>
      ctx.success({type: 'test', address: addr})
    );
    const validator = createValidator<'test'>(spy);

    validator('   ');
    validator(null as any);
    validator('0x' + 'a'.repeat(257));

    expect(spy).not.toHaveBeenCalled();
  });

  it('catches exceptions from inner validator and returns a generic INTERNAL_ERROR', () => {
    const result = throwingValidator('anything');
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.INTERNAL_ERROR);
      expect(result.message).toBe('Internal validation error');
      expect(result.message).not.toContain('boom');
      expect(result.original).toBe('anything');
    }
  });

  it('keeps the trimmed original when the inner validator throws', () => {
    const result = throwingValidator('  boom  ');
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.original).toBe('boom');
    }
  });

  it('uses a generic message for non-Error throws', () => {
    const validator = createValidator<'test'>(() => {
      throw 'string failure';
    });
    const result = validator('anything');
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.INTERNAL_ERROR);
      expect(result.message).toBe('Internal validation error');
    }
  });

  it('uses a generic message when the thrown Error has an empty message', () => {
    const validator = createValidator<'test'>(() => {
      throw new Error('');
    });
    const result = validator('anything');
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.message).toBe('Internal validation error');
    }
  });

  it('never throws for valid, invalid, or malformed input', () => {
    const inputs = [
      'will-not-throw-outside',
      '',
      '   ',
      '0x' + 'a'.repeat(257),
      '0x1234\x00',
      null,
      undefined,
    ];

    for (const input of inputs) {
      expect(() => throwingValidator(input as unknown as string)).not.toThrow();
    }
  });

  it('validation context success builds correct result shape', () => {
    const validator = createValidator<'mock'>((addr, ctx) =>
      ctx.success({type: 'mock', address: addr})
    );
    const res = validator('0x123');
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.type).toBe('mock');
      expect(res.address).toBe('0x123');
      expect(res.original).toBe('0x123');
    }
  });

  it('validation context failure builds correct result shape', () => {
    const validator = createValidator<'mock'>((_, ctx) =>
      ctx.failure({
        code: ValidationErrorCodes.INVALID_CHECKSUM,
        message: 'bad',
      })
    );
    const res = validator('0xabc');
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
      expect(res.message).toBe('bad');
      expect(res.original).toBe('0xabc');
    }
  });

  it('sets original to the trimmed input on failure', () => {
    const validator = createValidator<'mock'>((_, ctx) =>
      ctx.failure({
        code: ValidationErrorCodes.INVALID_FORMAT,
        message: 'bad',
      })
    );
    const res = validator('  bad  ');
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.original).toBe('bad');
    }
  });
});

const alwaysSuccessValidator = createValidator<'test'>((address, {success}) => {
  return success({type: 'test', address});
});

const throwingValidator = createValidator<'test'>(() => {
  throw new Error('boom');
});
