import {describe, it, expect} from 'vite-plus/test';

import {createValidator} from '../../src/utils/createValidator';
import {getEVMLogic} from '../../src/utils/evm';
import {ValidationErrorCodes} from '../../src/constants';
import {
  EVM_INVALID_CHECKSUM_DIGIT,
  EVM_INVALID_CHECKSUM_LETTER,
  EVM_INVALID_HEX,
  EVM_INVALID_LENGTH_LONG,
  EVM_INVALID_LENGTH_SHORT,
  EVM_INVALID_PREFIX,
  EVM_VALID_CHECKSUMMED,
  EVM_VALID_LEADING_ZERO,
  EVM_VALID_LOWERCASE,
  EVM_VALID_UPPERCASE,
  EVM_VALID_UPPERCASE_PREFIX,
  EVM_ZERO_ADDRESS,
} from '../fixtures/evm';

const validateGenericEVM = createValidator(getEVMLogic('GenericEVM'));

/**
 * Official EIP-55 test cases:
 * https://eips.ethereum.org/EIPS/eip-55#test-cases
 *
 * Kept local rather than in `tests/fixtures` so the expected checksums remain
 * explicit and auditable.
 */
const EIP55_REFERENCE_VECTORS = [
  '0x52908400098527886E0F7030069857D2E4169EE7',
  '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
  '0xde709f2102306220921060314715629080e2fb77',
  '0x27b1fdb04752bbc536007a920d24acb045561c26',
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
  '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
];

describe('EVM Logic validation (getEVMLogic)', () => {
  describe('official EIP-55 reference vectors', () => {
    it.each(EIP55_REFERENCE_VECTORS)('accepts %s', (addr) => {
      const result = validateGenericEVM(addr);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.type).toBe('GenericEVM');
        expect(result.address).toBe(addr.toLowerCase());
      }
    });

    it.each(EIP55_REFERENCE_VECTORS)(
      'rejects every single-letter checksum flip in %s',
      (addr) => {
        for (let i = 2; i < addr.length; i++) {
          const char = addr[i];
          if (!/[a-fA-F]/.test(char)) {
            continue;
          }

          const flipped =
            addr.slice(0, i) +
            (char === char.toLowerCase()
              ? char.toUpperCase()
              : char.toLowerCase()) +
            addr.slice(i + 1);
          const hex = flipped.slice(2);

          // EIP-55 deliberately accepts all-lowercase and all-uppercase input
          // as unchecksummed, so only mixed-case flips must fail.
          if (hex === hex.toLowerCase() || hex === hex.toUpperCase()) {
            continue;
          }

          const result = validateGenericEVM(flipped);
          expect(result.isValid, flipped).toBe(false);
          if (!result.isValid) {
            expect(result.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
          }
        }
      }
    );
  });

  describe('positive cases', () => {
    it('validates a correct EIP-55 checksum address', () => {
      const result = validateGenericEVM(EVM_VALID_CHECKSUMMED);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.type).toBe('GenericEVM');
        expect(result.address).toBe(EVM_VALID_LOWERCASE);
      }
    });

    it('accepts all-lowercase addresses', () => {
      const result = validateGenericEVM(EVM_VALID_LOWERCASE);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.address).toBe(EVM_VALID_LOWERCASE);
      }
    });

    it('accepts all-uppercase hex with a lowercase 0x prefix', () => {
      const result = validateGenericEVM(EVM_VALID_UPPERCASE);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.address).toBe(EVM_VALID_LOWERCASE);
      }
    });

    it('accepts the 0X prefix with a mixed-case checksum', () => {
      const result = validateGenericEVM(EVM_VALID_UPPERCASE_PREFIX);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.address).toBe(EVM_VALID_LOWERCASE);
      }
    });

    it('validates an all-numeric address', () => {
      const addr = `0x${'1'.repeat(40)}`;
      const result = validateGenericEVM(addr);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.address).toBe(addr);
      }
    });

    it('accepts a checksummed address with leading zero nibbles', () => {
      const result = validateGenericEVM(EVM_VALID_LEADING_ZERO);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.address).toBe(EVM_VALID_LEADING_ZERO.toLowerCase());
      }
    });

    it('accepts the zero address as a structurally valid EVM address', () => {
      const result = validateGenericEVM(EVM_ZERO_ADDRESS);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.address).toBe(EVM_ZERO_ADDRESS);
      }
    });
  });

  describe('negative cases', () => {
    it('fails when a single checksum letter is incorrectly cased', () => {
      const result = validateGenericEVM(EVM_INVALID_CHECKSUM_LETTER);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(result.message).toContain('checksum');
      }
    });

    it('fails when a digit change invalidates the EIP-55 checksum', () => {
      const result = validateGenericEVM(EVM_INVALID_CHECKSUM_DIGIT);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(result.message).toContain('checksum');
      }
    });

    it('fails on invalid hexadecimal characters', () => {
      const result = validateGenericEVM(EVM_INVALID_HEX);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.code).toBe(ValidationErrorCodes.INVALID_FORMAT);
        expect(result.message).toContain('hexadecimal');
      }
    });

    it('rejects addresses with invalid length (not 42 chars)', () => {
      [EVM_INVALID_LENGTH_SHORT, EVM_INVALID_LENGTH_LONG].forEach((addr) => {
        const result = validateGenericEVM(addr);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.code).toBe(ValidationErrorCodes.INVALID_LENGTH);
          expect(result.message).toContain('length');
        }
      });
    });

    it('fails on an incorrect 0x prefix', () => {
      const wrongPrefixes = [
        EVM_INVALID_PREFIX,
        `xx${EVM_VALID_LOWERCASE.slice(2)}`,
      ];
      wrongPrefixes.forEach((addr) => {
        const result = validateGenericEVM(addr);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.code).toBe(ValidationErrorCodes.INVALID_PREFIX);
          expect(result.message).toContain('prefix');
          expect(result.message).toContain('0x or 0X');
        }
      });
    });

    it('treats a prefix-less 40-character hex string as an invalid length', () => {
      const result = validateGenericEVM(EVM_VALID_LOWERCASE.slice(2));
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.code).toBe(ValidationErrorCodes.INVALID_LENGTH);
        expect(result.message).toContain('length');
      }
    });

    it('rejects 0X prefix with an incorrect checksum', () => {
      const result = validateGenericEVM(
        `0X${EVM_INVALID_CHECKSUM_LETTER.slice(2)}`
      );
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(result.message).toContain('checksum');
      }
    });
  });
});
