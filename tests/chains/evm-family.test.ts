import {describe, it, expect} from 'vite-plus/test';

import {
  validateBNB,
  validateBNBBatch,
  validateBEP20,
  validateBEP20Batch,
} from '../../src/chains/bnb';
import {
  validateERC20,
  validateERC20Batch,
  validateETH,
  validateETHBatch,
} from '../../src/chains/eth';
import {
  validateMatic,
  validateMaticBatch,
  validatePolygon,
  validatePolygonBatch,
} from '../../src/chains/polygon';
import {
  validateUSDTBEP20,
  validateUSDTBEP20Batch,
} from '../../src/aliases/usdt-bep20';
import {
  validateUSDTERC20,
  validateUSDTERC20Batch,
} from '../../src/aliases/usdt-erc20';
import {ValidationErrorCodes} from '../../src/constants';
import {
  EVM_INVALID_CHECKSUM_LETTER,
  EVM_VALID_CHECKSUMMED,
  EVM_VALID_LOWERCASE,
} from '../fixtures/evm';

// Ethereum, BNB, and Polygon share the EIP-55 logic in `src/utils/evm.ts`.
// The exhaustive format/checksum matrix lives in `tests/utils/evm.test.ts`;
// this file pins per-chain wiring, batch behavior, and aliases.

const evmChains = [
  {
    validate: validateETH,
    validateBatch: validateETHBatch,
    label: 'Ethereum',
  },
  {
    validate: validateBNB,
    validateBatch: validateBNBBatch,
    label: 'BNB',
  },
  {
    validate: validatePolygon,
    validateBatch: validatePolygonBatch,
    label: 'Polygon',
  },
];

const evmAliases = [
  {
    alias: validateERC20,
    aliasBatch: validateERC20Batch,
    base: validateETH,
    baseBatch: validateETHBatch,
    label: 'Ethereum',
  },
  {
    alias: validateBEP20,
    aliasBatch: validateBEP20Batch,
    base: validateBNB,
    baseBatch: validateBNBBatch,
    label: 'BNB',
  },
  {
    alias: validateMatic,
    aliasBatch: validateMaticBatch,
    base: validatePolygon,
    baseBatch: validatePolygonBatch,
    label: 'Polygon',
  },
];

describe.each(evmChains)(
  '$label validator (smoke tests)',
  ({validate, validateBatch, label}) => {
    it('returns correct label and normalized address for a valid EIP-55 address', () => {
      const result = validate(EVM_VALID_CHECKSUMMED);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.type).toBe(label);
        expect(result.address).toBe(EVM_VALID_LOWERCASE);
      }
    });

    it('returns the trimmed original with the normalized address', () => {
      const result = validate(`  ${EVM_VALID_CHECKSUMMED}  `);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.address).toBe(EVM_VALID_LOWERCASE);
        expect(result.original).toBe(EVM_VALID_CHECKSUMMED);
      }
    });

    it('fails with label in error message when checksum is broken', () => {
      const result = validate(EVM_INVALID_CHECKSUM_LETTER);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(result.message).toContain(label);
        expect(result.message).toContain('checksum');
      }
    });

    it('validates a batch and preserves ids, index, and original', () => {
      const [good, bad] = validateBatch([
        {address: EVM_VALID_CHECKSUMMED, id: 'good'},
        {address: EVM_INVALID_CHECKSUM_LETTER, id: 'bad'},
      ]);

      expect(good.index).toBe(0);
      expect(good.id).toBe('good');
      expect(good.original).toBe(EVM_VALID_CHECKSUMMED);
      expect(good.isValid).toBe(true);
      if (good.isValid) {
        expect(good.type).toBe(label);
        expect(good.address).toBe(EVM_VALID_LOWERCASE);
      }

      expect(bad.index).toBe(1);
      expect(bad.id).toBe('bad');
      expect(bad.original).toBe(EVM_INVALID_CHECKSUM_LETTER);
      expect(bad.isValid).toBe(false);
      if (!bad.isValid) {
        expect(bad.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(bad.message).toContain(label);
      }
    });
  }
);

describe('EVM token and network aliases', () => {
  it.each(evmAliases)(
    '$label aliases match their base validator',
    ({alias, aliasBatch, base, baseBatch, label}) => {
      const single = alias(EVM_VALID_CHECKSUMMED);
      expect(single.isValid).toBe(true);
      if (single.isValid) expect(single.type).toBe(label);
      expect(single).toEqual(base(EVM_VALID_CHECKSUMMED));

      const invalid = alias(EVM_INVALID_CHECKSUM_LETTER);
      expect(invalid.isValid).toBe(false);
      if (!invalid.isValid) {
        expect(invalid.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
      }

      expect(aliasBatch([EVM_VALID_CHECKSUMMED])).toEqual(
        baseBatch([EVM_VALID_CHECKSUMMED])
      );
    }
  );

  it('USDT wrappers match their base validators', () => {
    expect(validateUSDTERC20(EVM_VALID_CHECKSUMMED)).toEqual(
      validateETH(EVM_VALID_CHECKSUMMED)
    );
    expect(validateUSDTBEP20(EVM_VALID_CHECKSUMMED)).toEqual(
      validateBNB(EVM_VALID_CHECKSUMMED)
    );
    expect(validateUSDTERC20Batch([EVM_VALID_CHECKSUMMED])).toEqual(
      validateETHBatch([EVM_VALID_CHECKSUMMED])
    );
    expect(validateUSDTBEP20Batch([EVM_VALID_CHECKSUMMED])).toEqual(
      validateBNBBatch([EVM_VALID_CHECKSUMMED])
    );
  });
});
