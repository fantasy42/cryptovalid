import type {BatchItem} from '../../types';

import {describe, it, expect} from 'vite-plus/test';

import {batch} from '../batch';
import {createValidator} from '../createValidator';
import {ValidationErrorCodes} from '../../constants';

const okValidator = createValidator<'Ok'>((address) => ({
  isValid: true,
  type: 'Ok',
  address,
}));

const failValidator = createValidator<'Fail'>((_, ctx) =>
  ctx.failure({
    code: ValidationErrorCodes.UNSUPPORTED_TYPE,
    message: 'always invalid',
  })
);

const conditionalValidator = createValidator<'Cond'>((address, ctx) =>
  address === 'valid'
    ? {isValid: true, type: 'Cond', address}
    : ctx.failure({
        code: ValidationErrorCodes.INVALID_FORMAT,
        message: `unexpected: ${address}`,
      })
);

const throwingValidator = createValidator<'Throw'>(() => {
  throw new Error('internal crash');
});

const normalizingValidator = createValidator<'Norm'>((address, ctx) => {
  const trimmed = address.trim();
  if (trimmed.length === 0)
    return ctx.failure({
      code: ValidationErrorCodes.EMPTY,
      message: 'empty',
    });
  return {
    isValid: true,
    type: 'Norm',
    address: trimmed.toLowerCase(),
  };
});

describe('batch', () => {
  describe('with valid items', () => {
    it('returns an empty array when given no items', () => {
      expect(batch(okValidator, [])).toEqual([]);
    });

    it('returns results with consecutive indices starting from 0', () => {
      const results = batch(okValidator, ['a', 'b', 'c']);
      expect(results.map((r) => r.index)).toEqual([0, 1, 2]);
    });

    it('preserves input order in the output', () => {
      const results = batch(okValidator, ['first', 'second']);
      expect(results[0].original).toBe('first');
      expect(results[1].original).toBe('second');
    });

    it('trims the original input', () => {
      const results = batch(okValidator, ['  foo  ']);
      expect(results[0].original).toBe('foo');
    });

    it('delegates trimming to the validator (address is trimmed)', () => {
      const results = batch(okValidator, ['  bar  ']);
      expect(results[0].isValid).toBe(true);
      if (results[0].isValid) {
        expect(results[0].address).toBe('bar');
      }
      expect(results[0].original).toBe('bar');
    });

    it('returns isValid:true for every item when all are valid', () => {
      const results = batch(okValidator, ['x', 'y', 'z']);
      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r.isValid).toBe(true);
        if (r.isValid) {
          expect(r.type).toBe('Ok');
        }
      });
    });
  });

  describe('with invalid items', () => {
    it('returns isValid:false for every item when all are invalid', () => {
      const results = batch(failValidator, ['a', 'b']);
      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(r.isValid).toBe(false);
        if (!r.isValid) {
          expect(r.code).toBe(ValidationErrorCodes.UNSUPPORTED_TYPE);
          expect(r.message).toBe('always invalid');
          expect(r.original).toBe(r.index === 0 ? 'a' : 'b');
        }
      });
    });

    it('returns a failure result when the validator throws', () => {
      const results = batch(throwingValidator, ['  item  ']);
      expect(results[0].isValid).toBe(false);
      if (!results[0].isValid) {
        expect(results[0].code).toBe(ValidationErrorCodes.INTERNAL_ERROR);
        expect(results[0].message).toBe('Internal validation error');
        expect(results[0].original).toBe('item');
      }
    });

    it('does not throw when the underlying validator throws', () => {
      expect(() => batch(throwingValidator, ['anything'])).not.toThrow();
    });
  });

  describe('with mixed items', () => {
    it('collects all results even when some are invalid', () => {
      const results = batch(conditionalValidator, ['valid', 'nope', 'valid']);
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });

    it('preserves error codes and messages from failed items', () => {
      const results = batch(conditionalValidator, ['valid', 'invalid1']);
      expect(results[1].isValid).toBe(false);
      if (!results[1].isValid) {
        expect(results[1].code).toBe(ValidationErrorCodes.INVALID_FORMAT);
        expect(results[1].message).toContain('unexpected');
      }
    });
  });

  describe('with BatchItem objects', () => {
    it('accepts plain strings as BatchItem', () => {
      const results = batch(okValidator, ['plain']);
      expect(results[0].isValid).toBe(true);
      expect(results[0].original).toBe('plain');
      expect(results[0].id).toBeUndefined();
    });

    it('accepts objects with address and optional id', () => {
      const items: BatchItem[] = [
        {address: 'foo', id: 'first'},
        {address: 'bar', id: 42},
      ];
      const results = batch(okValidator, items);
      expect(results[0].id).toBe('first');
      expect(results[1].id).toBe(42);
    });

    it('omits id when not provided in the input object', () => {
      const items: BatchItem[] = [{address: 'no-id'}];
      const results = batch(okValidator, items);
      expect(results[0].id).toBeUndefined();
      expect(Object.hasOwn(results[0], 'id')).toBe(false);
    });

    it('omits id for plain strings', () => {
      const results = batch(okValidator, ['plain']);
      expect(Object.hasOwn(results[0], 'id')).toBe(false);
    });

    it('ignores id values that are not strings or numbers', () => {
      const items = [{address: 'a', id: true}] as unknown as BatchItem[];
      const results = batch(okValidator, items);
      expect(results[0].id).toBeUndefined();
      expect(Object.hasOwn(results[0], 'id')).toBe(false);
    });

    it('handles a mix of plain strings and objects', () => {
      const items: BatchItem[] = ['plain', {address: 'obj', id: 'custom'}];
      const results = batch(okValidator, items);
      expect(results[0].id).toBeUndefined();
      expect(results[1].id).toBe('custom');
    });

    it('handles id = 0 and empty-string ids as present', () => {
      const items: BatchItem[] = [
        {address: 'a', id: 0},
        {address: 'b', id: ''},
      ];
      const results = batch(okValidator, items);
      expect(results[0].id).toBe(0);
      expect(results[1].id).toBe('');
      expect(Object.hasOwn(results[1], 'id')).toBe(true);
    });

    it('omits id when it is null or undefined', () => {
      const items = [
        {address: 'a', id: null},
        {address: 'b', id: undefined},
      ] as unknown as BatchItem[];
      const results = batch(okValidator, items);

      expect(results[0].id).toBeUndefined();
      expect(results[1].id).toBeUndefined();
      expect(Object.hasOwn(results[0], 'id')).toBe(false);
      expect(Object.hasOwn(results[1], 'id')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('narrows the type correctly when checking isValid (valid branch)', () => {
      const results = batch(okValidator, ['x']);
      const result = results[0];
      if (result.isValid) {
        const _type: string = result.type;
        const _address: string = result.address;
        expect(_type).toBe('Ok');
        expect(_address).toBe('x');
      } else {
        const _code = result.code;
        const _message = result.message;
        expect(_code).toBeTruthy();
        expect(_message).toBeTruthy();
      }
    });

    it('narrows the type correctly when checking isValid (invalid branch)', () => {
      const results = batch(conditionalValidator, ['invalid']);
      const result = results[0];
      if (!result.isValid) {
        expect(result.code).toBe(ValidationErrorCodes.INVALID_FORMAT);
        expect(result.message).toContain('unexpected');
        expect(result.original).toBe('invalid');
      }
    });

    it('handles empty string (validator rejects via createValidator)', () => {
      const results = batch(okValidator, ['']);
      expect(results[0].isValid).toBe(false);
      if (!results[0].isValid) {
        expect(results[0].code).toBe(ValidationErrorCodes.EMPTY);
        expect(results[0].message).toBe(
          'Address must not be empty or whitespace'
        );
        expect(results[0].original).toBe('');
      }
    });

    it('handles whitespace-only strings', () => {
      const results = batch(okValidator, ['   ']);
      expect(results[0].isValid).toBe(false);
      if (!results[0].isValid) {
        expect(results[0].code).toBe(ValidationErrorCodes.EMPTY);
        expect(results[0].original).toBe('');
      }
    });

    it('handles very long inputs (createValidator length limit)', () => {
      const longAddress = 'a'.repeat(257);
      const results = batch(okValidator, [longAddress]);
      expect(results[0].isValid).toBe(false);
      if (!results[0].isValid) {
        expect(results[0].code).toBe(ValidationErrorCodes.TOO_LONG);
        expect(results[0].original).toBe(longAddress);
      }
    });

    it('defensive: non-string address in object does not throw', () => {
      const items = [{address: null as unknown as string}];
      expect(() => batch(okValidator, items)).not.toThrow();
      const results = batch(okValidator, items);
      expect(results[0].isValid).toBe(false);
      if (!results[0].isValid) {
        expect(results[0].code).toBe(ValidationErrorCodes.EMPTY);
        expect(results[0].original).toBe('');
      }
    });

    it('reports null/undefined batch items as empty addresses', () => {
      const results = batch(okValidator, [
        {address: '' as any},
        null as any,
        undefined as any,
      ]);
      expect(results).toHaveLength(3);

      for (const result of results) {
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.code).toBe(ValidationErrorCodes.EMPTY);
          expect(result.original).toBe('');
        }
      }
    });

    it('reports non-string object addresses as empty addresses', () => {
      const items = [{address: 42}] as unknown as BatchItem[];
      const results = batch(okValidator, items);

      expect(results[0].isValid).toBe(false);
      if (!results[0].isValid) {
        expect(results[0].code).toBe(ValidationErrorCodes.EMPTY);
        expect(results[0].original).toBe('');
      }
    });

    it('visits sparse-array holes as empty addresses', () => {
      const items: BatchItem[] = [];
      items.length = 3;
      items[0] = 'a';
      items[2] = 'c';

      const results = batch(okValidator, items);

      expect(results).toHaveLength(3);
      expect(1 in results).toBe(true);
      expect(results[0].original).toBe('a');
      expect(results[1].isValid).toBe(false);
      if (!results[1].isValid) {
        expect(results[1].code).toBe(ValidationErrorCodes.EMPTY);
        expect(results[1].original).toBe('');
      }
      expect(results[2].original).toBe('c');
    });

    it('distinguishes original vs normalized address', () => {
      const mixedCase = ' 0XD8DA6BF26964AF9D7EED9E03E53415D37AA96045 ';
      const results = batch(normalizingValidator, [mixedCase]);
      expect(results[0].original).toBe(
        '0XD8DA6BF26964AF9D7EED9E03E53415D37AA96045'
      );
      if (results[0].isValid) {
        expect(results[0].address).toBe(
          '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        );
      }
    });

    it('preserves the validator original instead of recomputing it', () => {
      const validate = (address: string) =>
        ({
          isValid: true,
          type: 'Raw',
          address,
          original: 'from-validator',
        }) as const;

      const results = batch(validate, ['  padded  ']);
      expect(results[0].original).toBe('from-validator');
    });

    it('handles 10k addresses without stack issues', () => {
      const count = 10_000;
      const items = Array.from({length: count}, (_, i) => `addr-${i}`);
      const results = batch(okValidator, items);
      expect(results).toHaveLength(count);
      expect(results[0].index).toBe(0);
      expect(results[count - 1].index).toBe(count - 1);
      results.forEach((r) => expect(r.isValid).toBe(true));
    });

    it('does not mutate the input array or its items', () => {
      const items: BatchItem[] = ['a', {address: 'b', id: 1}];
      const snapshot = structuredClone(items);
      batch(okValidator, items);
      expect(items).toEqual(snapshot);
    });

    it('rejects non-array input with a clear TypeError', () => {
      expect(() => batch(okValidator, 'abc' as unknown as BatchItem[])).toThrow(
        new TypeError('Expected an array of BatchItem values')
      );
    });
  });
});
