import type {BatchItem} from '../../types';

import {describe, it, expect} from 'vite-plus/test';

import {batch} from '../batch';
import {createBatchValidator} from '../createBatchValidator';
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

describe('createBatchValidator', () => {
  it('returns a function that accepts readonly BatchItem[]', () => {
    const batchFn = createBatchValidator(okValidator);
    expect(typeof batchFn).toBe('function');
  });

  it('calls the underlying validator for each item', () => {
    const batchFn = createBatchValidator(okValidator);
    const results = batchFn(['a', 'b']);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.isValid)).toBe(true);
  });

  it('passes through errors from the validator', () => {
    const batchFn = createBatchValidator(failValidator);
    const results = batchFn(['x']);
    expect(results[0].isValid).toBe(false);
    if (!results[0].isValid) {
      expect(results[0].code).toBe(ValidationErrorCodes.UNSUPPORTED_TYPE);
      expect(results[0].message).toBe('always invalid');
      expect(results[0].original).toBe('x');
    }
  });

  it('preserves order and indices', () => {
    const batchFn = createBatchValidator(okValidator);
    const results = batchFn(['first', 'second']);
    expect(results[0].index).toBe(0);
    expect(results[1].index).toBe(1);
  });

  it('handles mixed BatchItem objects', () => {
    const batchFn = createBatchValidator(okValidator);
    const items: BatchItem[] = [{address: 'foo', id: 'field1'}, 'bar'];
    const results = batchFn(items);
    expect(results[0].id).toBe('field1');
    expect(results[1].id).toBeUndefined();
  });

  it('delegates to the shared batch helper for mixed items', () => {
    const items: BatchItem[] = [
      'ok',
      {address: '', id: 'empty-field'},
      {address: '  padded  ', id: 0},
    ];
    const batchFn = createBatchValidator(okValidator);
    expect(batchFn(items)).toEqual(batch(okValidator, items));
  });
});
