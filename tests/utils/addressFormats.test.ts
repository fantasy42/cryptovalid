import {describe, it, expect} from 'vite-plus/test';

import {
  isBitcoinAddress,
  isEVMAddress,
  isLitecoinAddress,
  isSolanaAddress,
  isStellarAddress,
  isTONAddress,
  isTronAddress,
  isXRPAddress,
} from '../../src/utils/addressFormats';

const VALID_ETH = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const VALID_BTC_BECH32M =
  'bc1pgn0mhnu0aqe888sqh5mewlvt26gcr4v6d886qt3hxxfspuwpqx2q4xk59v';
const VALID_LTC_P2PKH = 'LaMZFeV1XdQ6yo8AzdrUHPrgKyfFmMG53b';
const VALID_LTC_P2SH_M = 'MT2UaUAzwxhaP6WbqkVThnQ5Shn2zYZEh6';
const VALID_LTC_BECH32M =
  'ltc1px9hnhzeryfrdq8srwtxj40phw8scg29euc726hg28xy96frk089q3d3t5f';
const VALID_SOL_44 = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const VALID_XLM_MUXED =
  'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAABUTGI4';

describe('address format predicates', () => {
  describe('EVM', () => {
    it('accepts 0x and 0X prefixes', () => {
      expect(isEVMAddress(VALID_ETH)).toBe(true);
      expect(isEVMAddress('0X' + VALID_ETH.slice(2))).toBe(true);
    });

    it('accepts all-lowercase and all-uppercase hex', () => {
      expect(isEVMAddress(VALID_ETH.toLowerCase())).toBe(true);
      expect(isEVMAddress(VALID_ETH.toUpperCase())).toBe(true);
    });

    it('rejects wrong length, prefix, and non-hex characters', () => {
      expect(isEVMAddress('0x1234')).toBe(false);
      expect(isEVMAddress('0x' + 'a'.repeat(39))).toBe(false);
      expect(isEVMAddress('0x' + 'a'.repeat(41))).toBe(false);
      expect(isEVMAddress('1x' + VALID_ETH.slice(2))).toBe(false);
      expect(isEVMAddress('0x' + 'g'.repeat(40))).toBe(false);
    });
  });

  describe('Bitcoin', () => {
    it('accepts legacy and Bech32 forms', () => {
      expect(isBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
      expect(isBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
      expect(
        isBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      ).toBe(true);
    });

    it('accepts uppercase Bech32', () => {
      expect(
        isBitcoinAddress(
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'.toUpperCase()
        )
      ).toBe(true);
    });

    it('accepts Bech32m/Taproot', () => {
      expect(isBitcoinAddress(VALID_BTC_BECH32M)).toBe(true);
    });

    it('rejects other chains and random strings', () => {
      expect(isBitcoinAddress(VALID_ETH)).toBe(false);
      expect(
        isBitcoinAddress('ltc1qv43gel3n5hktls3tl0rpz3qrt98t0pavgaec9w')
      ).toBe(false);
      expect(isBitcoinAddress('random123')).toBe(false);
    });
  });

  describe('Litecoin', () => {
    it('accepts legacy and Bech32 forms', () => {
      expect(isLitecoinAddress('3LpLGam2zqr9abEhjsW7t99g81Bavt3wY7')).toBe(
        true
      );
      expect(
        isLitecoinAddress('ltc1qv43gel3n5hktls3tl0rpz3qrt98t0pavgaec9w')
      ).toBe(true);
      expect(
        isLitecoinAddress(
          'ltc1qv43gel3n5hktls3tl0rpz3qrt98t0pavgaec9w'.toUpperCase()
        )
      ).toBe(true);
    });

    it('accepts P2PKH L and P2SH M forms', () => {
      expect(isLitecoinAddress(VALID_LTC_P2PKH)).toBe(true);
      expect(isLitecoinAddress(VALID_LTC_P2SH_M)).toBe(true);
    });

    it('accepts Bech32m/Taproot', () => {
      expect(isLitecoinAddress(VALID_LTC_BECH32M)).toBe(true);
    });

    it('does not treat a Stellar muxed M address as Litecoin', () => {
      expect(isLitecoinAddress(VALID_XLM_MUXED)).toBe(false);
      expect(isStellarAddress(VALID_XLM_MUXED)).toBe(true);
    });

    it('rejects other chains', () => {
      expect(isLitecoinAddress(VALID_ETH)).toBe(false);
      expect(
        isLitecoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      ).toBe(false);
    });
  });

  describe('Solana', () => {
    it('accepts 32-44 character base58 values', () => {
      expect(
        isSolanaAddress('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV')
      ).toBe(true);
      expect(isSolanaAddress('1'.repeat(32))).toBe(true);
      expect(isSolanaAddress(VALID_SOL_44)).toBe(true);
    });

    it('rejects values outside the length or alphabet', () => {
      expect(isSolanaAddress('1'.repeat(31))).toBe(false);
      expect(isSolanaAddress('1'.repeat(45))).toBe(false);
      expect(isSolanaAddress('0'.repeat(32))).toBe(false);
    });
  });

  describe('TRON', () => {
    it('accepts the Base58 T-address shape', () => {
      expect(isTronAddress('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')).toBe(true);
    });

    it('rejects wrong length or prefix', () => {
      expect(isTronAddress('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWw')).toBe(false);
      expect(isTronAddress('X9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')).toBe(false);
    });
  });

  describe('XRP', () => {
    it('accepts classic and X-addresses', () => {
      expect(isXRPAddress('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).toBe(true);
      expect(
        isXRPAddress('XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi')
      ).toBe(true);
    });

    it('rejects wrong prefixes and lengths', () => {
      expect(isXRPAddress('rHb9CJAWyB4rj91VRWn96Dk')).toBe(false);
      expect(isXRPAddress('RHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).toBe(false);
    });
  });

  describe('Stellar', () => {
    it('accepts standard and muxed addresses', () => {
      expect(
        isStellarAddress(
          'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B'
        )
      ).toBe(true);
      expect(
        isStellarAddress(
          'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAABUTGI4'
        )
      ).toBe(true);
    });

    it('rejects unsupported prefixes and lengths', () => {
      expect(
        isStellarAddress(
          'SAAAAAAAAAAAAAB7BQ2L7E5NBWMXDUCMZSIPOBKRDSBYVLMXGFA5FSSUBWBK7H53A5OPM'
        )
      ).toBe(false);
      expect(
        isStellarAddress(
          'GA7FCCWP2YRFQWJ5M7BHBIXSMJJJBSUZWHCSVMRBXVTXM7RF4J6EUOJ'
        )
      ).toBe(false);
    });
  });

  describe('TON', () => {
    it('accepts raw and user-friendly forms', () => {
      expect(
        isTONAddress(
          '0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3'
        )
      ).toBe(true);
      expect(
        isTONAddress(
          '-1:3333333333333333333333333333333333333333333333333333333333333333'
        )
      ).toBe(true);
      expect(
        isTONAddress(
          '1:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3'
        )
      ).toBe(true);
    });

    it('accepts mainnet, testnet, and standard-base64 user-friendly forms', () => {
      expect(
        isTONAddress('EQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4wJB')
      ).toBe(true);
      expect(
        isTONAddress('EQAs9VlT6S776tq3unJcP5Ogsj+ELLunLXuOb1EKcOQi4wJB')
      ).toBe(true);
      expect(
        isTONAddress('kQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi47nL')
      ).toBe(true);
      expect(
        isTONAddress('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO')
      ).toBe(true);
    });

    it('rejects random strings', () => {
      expect(isTONAddress('random123')).toBe(false);
      expect(
        isTONAddress('ton://EQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4wJB')
      ).toBe(false);
    });
  });
});
