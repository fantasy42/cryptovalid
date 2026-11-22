import type {Route} from '../../src/any/routes';
import type {SupportedChain} from '../../src/any/types';

import {describe, it, expect} from 'vite-plus/test';

import {validateAny, validateAnyBatch} from '../../src/any';
import {ROUTES, evaluateRoutes} from '../../src/any/routes';
import {ValidationErrorCodes} from '../../src/constants';

const VALID_ETH = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const INVALID_EVM_CHECKSUM = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96046';
const INVALID_BTC_P2SH = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLz';
const INVALID_LTC_P2PKH = 'LaMZFeV1XdQ6yo8AzdrUHPrgKyfFmMG53c';
const INVALID_LTC_BECH32 = 'ltc1qv43gel3n5hktls3tl0rpz3qrt98t0pavgaec9x';
const INVALID_TRX = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwc';
const INVALID_XRP = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTg';
const INVALID_XLM_MUXED =
  'MB7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAABUTGI4';
const VALID_BTC_P2PKH = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const VALID_BTC_P2SH = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
const VALID_BTC_BECH32 = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const VALID_BTC_BECH32M =
  'bc1pgn0mhnu0aqe888sqh5mewlvt26gcr4v6d886qt3hxxfspuwpqx2q4xk59v';
const VALID_LTC_P2PKH = 'LaMZFeV1XdQ6yo8AzdrUHPrgKyfFmMG53b';
const VALID_LTC_P2SH_M = 'MT2UaUAzwxhaP6WbqkVThnQ5Shn2zYZEh6';
const VALID_LTC_P2SH = '3LpLGam2zqr9abEhjsW7t99g81Bavt3wY7'; // legacy P2SH, starts with 3
const VALID_LTC_BECH32 = 'ltc1qv43gel3n5hktls3tl0rpz3qrt98t0pavgaec9w';
const VALID_LTC_BECH32M =
  'ltc1px9hnhzeryfrdq8srwtxj40phw8scg29euc726hg28xy96frk089q3d3t5f';
const VALID_SOL = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV';
const VALID_SOL_44 = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const VALID_TRX = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
const VALID_XRP = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
const VALID_XRP_X = 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi';
const VALID_XLM = 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B';
const VALID_XLM_MUXED =
  'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAABUTGI4';
const VALID_TON_RAW =
  '0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3';
const VALID_TON_USER = 'EQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4wJB';

describe('validateAny', () => {
  describe('positive multi-match', () => {
    it('detects EVM address on Ethereum, BNB, and Polygon', () => {
      const res = validateAny(VALID_ETH);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Ethereum', 'BNB', 'Polygon']);
        expect(res.address).toBe(VALID_ETH.toLowerCase());
        expect(res.original).toBe(VALID_ETH);
      }
    });

    it('detects legacy P2SH address on both Bitcoin and Litecoin', () => {
      // Because Bitcoin and Litecoin share the same P2SH version byte (0x05),
      // a valid P2SH address is structurally valid on both chains.
      const res = validateAny(VALID_LTC_P2SH);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Bitcoin', 'Litecoin']);
        expect(res.address).toBe(VALID_LTC_P2SH);
        expect(res.original).toBe(VALID_LTC_P2SH);
      }
    });
  });

  describe('single-chain matches', () => {
    it('returns Bitcoin for valid bech32', () => {
      const res = validateAny(VALID_BTC_BECH32);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Bitcoin']);
        expect(res.original).toBe(VALID_BTC_BECH32);
      }
    });

    it('returns Solana for valid base58 address', () => {
      const res = validateAny(VALID_SOL);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['Solana']);
    });

    it('returns TRON for valid TRX address', () => {
      const res = validateAny(VALID_TRX);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['TRON']);
    });

    it('returns XRP for valid classic address', () => {
      const res = validateAny(VALID_XRP);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['XRP']);
    });

    it('returns XRP for valid X-address', () => {
      const res = validateAny(VALID_XRP_X);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['XRP']);
    });

    it('returns Litecoin for valid Bech32 (ltc1) address', () => {
      const res = validateAny(VALID_LTC_BECH32);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['Litecoin']);
    });

    it('returns Stellar for valid G… address', () => {
      const res = validateAny(VALID_XLM);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['Stellar']);
    });

    it('returns Stellar for valid muxed M… address', () => {
      const res = validateAny(VALID_XLM_MUXED);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['Stellar']);
    });

    it('returns TON for valid raw address', () => {
      const res = validateAny(VALID_TON_RAW);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['TON']);
    });

    it('returns TON for valid user‑friendly address', () => {
      const res = validateAny(VALID_TON_USER);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['TON']);
    });
  });

  describe('known-valid format fixtures', () => {
    const fixtures: Array<{
      label: string;
      address: string;
      chain: SupportedChain;
    }> = [
      {label: 'Bitcoin P2PKH', address: VALID_BTC_P2PKH, chain: 'Bitcoin'},
      {label: 'Bitcoin P2SH', address: VALID_BTC_P2SH, chain: 'Bitcoin'},
      {label: 'Bitcoin Bech32', address: VALID_BTC_BECH32, chain: 'Bitcoin'},
      {label: 'Bitcoin Bech32m', address: VALID_BTC_BECH32M, chain: 'Bitcoin'},
      {label: 'Litecoin P2PKH', address: VALID_LTC_P2PKH, chain: 'Litecoin'},
      {label: 'Litecoin P2SH M', address: VALID_LTC_P2SH_M, chain: 'Litecoin'},
      {label: 'Litecoin P2SH 3', address: VALID_LTC_P2SH, chain: 'Litecoin'},
      {label: 'Litecoin Bech32', address: VALID_LTC_BECH32, chain: 'Litecoin'},
      {
        label: 'Litecoin Bech32m',
        address: VALID_LTC_BECH32M,
        chain: 'Litecoin',
      },
      {label: 'Ethereum', address: VALID_ETH, chain: 'Ethereum'},
      {label: 'Solana 32-byte', address: '1'.repeat(32), chain: 'Solana'},
      {label: 'Solana 43-char', address: VALID_SOL, chain: 'Solana'},
      {label: 'Solana 44-char', address: VALID_SOL_44, chain: 'Solana'},
      {label: 'TRON', address: VALID_TRX, chain: 'TRON'},
      {label: 'XRP classic', address: VALID_XRP, chain: 'XRP'},
      {label: 'XRP X-address', address: VALID_XRP_X, chain: 'XRP'},
      {label: 'Stellar standard', address: VALID_XLM, chain: 'Stellar'},
      {label: 'Stellar muxed', address: VALID_XLM_MUXED, chain: 'Stellar'},
      {label: 'TON raw', address: VALID_TON_RAW, chain: 'TON'},
      {label: 'TON user-friendly', address: VALID_TON_USER, chain: 'TON'},
    ];

    it.each(fixtures)('$label routes to $chain', ({address, chain}) => {
      const result = validateAny(address);
      expect(result.isValid).toBe(true);
      if (result.isValid) expect(result.chains).toContain(chain);
    });
  });

  describe('format variants accepted by the chain validators', () => {
    it('routes uppercase Bitcoin Bech32 and normalizes the address', () => {
      const upper = VALID_BTC_BECH32.toUpperCase();
      const res = validateAny(upper);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Bitcoin']);
        expect(res.address).toBe(VALID_BTC_BECH32);
        expect(res.original).toBe(upper);
      }
    });

    it('routes uppercase Litecoin Bech32 and normalizes the address', () => {
      const upper = VALID_LTC_BECH32.toUpperCase();
      const res = validateAny(upper);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Litecoin']);
        expect(res.address).toBe(VALID_LTC_BECH32);
        expect(res.original).toBe(upper);
      }
    });

    it('routes the uppercase 0X EVM prefix and normalizes the address', () => {
      const address = '0X' + VALID_ETH.slice(2);
      const res = validateAny(address);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Ethereum', 'BNB', 'Polygon']);
        expect(res.address).toBe(VALID_ETH.toLowerCase());
      }
    });

    it('routes 32-character Solana addresses', () => {
      const address = '1'.repeat(32);
      const res = validateAny(address);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['Solana']);
    });

    it('routes TON testnet user-friendly addresses', () => {
      const address = 'kQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi47nL';
      const res = validateAny(address);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['TON']);
    });

    it('routes standard-base64 TON user-friendly addresses', () => {
      const address = 'EQAs9VlT6S776tq3unJcP5Ogsj+ELLunLXuOb1EKcOQi4wJB';
      const res = validateAny(address);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['TON']);
        // TON does not canonicalize base64/base64url forms.
        expect(res.address).toBe(address);
      }
    });

    it('routes TON raw addresses with a non-default workchain', () => {
      const address = `1:${'a'.repeat(64)}`;
      const res = validateAny(address);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.chains).toEqual(['TON']);
    });

    it('returns the trimmed input as original', () => {
      const res = validateAny(`  ${VALID_ETH}  `);
      expect(res.isValid).toBe(true);
      if (res.isValid) expect(res.original).toBe(VALID_ETH);
    });
  });

  describe('negative - unrecognised format', () => {
    it('returns UNSUPPORTED_TYPE for random string', () => {
      const res = validateAny('random123');
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.UNSUPPORTED_TYPE);
        expect(res.original).toBe('random123');
      }
    });

    it('trims original on failure', () => {
      const res = validateAny('  random123  ');
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.UNSUPPORTED_TYPE);
        expect(res.original).toBe('random123');
      }
    });

    it('returns UNSUPPORTED_TYPE for .eth name', () => {
      const res = validateAny('vitalik.eth');
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.UNSUPPORTED_TYPE);
        expect(res.original).toBe('vitalik.eth');
      }
    });
  });

  describe('negative - pre-check failures', () => {
    it('handles null/undefined', () => {
      const res = validateAny(null as any);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.NULL_OR_UNDEFINED);
        expect(res.original).toBe('');
      }
    });

    it('handles empty string', () => {
      const res = validateAny('   ');
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.EMPTY);
        expect(res.original).toBe('');
      }
    });

    it('handles too long input', () => {
      const long = '0x' + 'a'.repeat(257);
      const res = validateAny(long);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.TOO_LONG);
        expect(res.original).toBe(long.trim());
      }
    });

    it('handles non-ASCII characters', () => {
      const res = validateAny('0x1234\x00abcd');
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHARACTERS);
        expect(res.original).toBe('0x1234\x00abcd'.trim());
      }
    });
  });

  describe('negative - matched route but invalid', () => {
    it('returns EVM checksum error for invalid EIP‑55 address', () => {
      const res = validateAny(INVALID_EVM_CHECKSUM);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.message).toContain('checksum');
        expect(res.original).toBe(INVALID_EVM_CHECKSUM);
      }
    });

    it('returns the Bitcoin checksum error for a bad P2SH address', () => {
      const res = validateAny(INVALID_BTC_P2SH);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.message).toBe('Checksum mismatch');
        expect(res.original).toBe(INVALID_BTC_P2SH);
      }
    });

    it('returns the Litecoin error for an invalid L… address', () => {
      const res = validateAny(INVALID_LTC_P2PKH);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.message).toBe('Checksum mismatch');
        expect(res.original).toBe(INVALID_LTC_P2PKH);
      }
    });

    it('returns the Litecoin error for an invalid ltc1… address', () => {
      const res = validateAny(INVALID_LTC_BECH32);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.message).toBe('Invalid Bech32/Bech32m checksum or encoding');
        expect(res.original).toBe(INVALID_LTC_BECH32);
      }
    });

    it('returns the TRON error instead of the broad Solana error', () => {
      const res = validateAny(INVALID_TRX);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.message).toBe('Checksum mismatch');
        expect(res.original).toBe(INVALID_TRX);
      }
    });

    it('returns the XRP error instead of the broad Solana error', () => {
      const res = validateAny(INVALID_XRP);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.message).toBe('Checksum mismatch');
        expect(res.original).toBe(INVALID_XRP);
      }
    });

    it('returns the Stellar error for an invalid muxed M address', () => {
      const res = validateAny(INVALID_XLM_MUXED);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.message).toBe('Checksum mismatch');
        expect(res.original).toBe(INVALID_XLM_MUXED);
      }
    });

    it('trims original on a matched-route failure', () => {
      const res = validateAny(`  ${INVALID_LTC_P2PKH}  `);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
        expect(res.original).toBe(INVALID_LTC_P2PKH);
      }
    });
  });

  describe('cross-chain isolation', () => {
    it('does not misinterpret Solana as Bitcoin or TRON', () => {
      const res = validateAny(VALID_SOL);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Solana']);
        expect(res.original).toBe(VALID_SOL);
      }
    });
  });
  describe('route configuration', () => {
    // Enumerating every key makes this fail to compile when SupportedChain
    // changes without updating the expected route coverage.
    const EXPECTED_CHAINS: Record<SupportedChain, true> = {
      Bitcoin: true,
      Ethereum: true,
      BNB: true,
      Polygon: true,
      Solana: true,
      TRON: true,
      Litecoin: true,
      XRP: true,
      Stellar: true,
      TON: true,
    };

    it('configures exactly one validator entry per supported chain', () => {
      const configuredChains = ROUTES.flatMap((route) =>
        route.validators.map((validator) => validator.chain)
      );

      expect(configuredChains).toHaveLength(
        Object.keys(EXPECTED_CHAINS).length
      );
      expect(new Set(configuredChains)).toEqual(
        new Set(Object.keys(EXPECTED_CHAINS))
      );
    });

    it('configures at least one validator per route', () => {
      for (const route of ROUTES) {
        expect(route.validators.length).toBeGreaterThan(0);
      }
    });

    it('checks the broad Solana route last', () => {
      const lastRoute = ROUTES[ROUTES.length - 1];
      expect(lastRoute.validators.map((validator) => validator.chain)).toEqual([
        'Solana',
      ]);
    });

    it('uses the first successful validator address in route order', () => {
      const routes: Route[] = [
        {
          predicate: () => true,
          validators: [
            {
              chain: 'Bitcoin',
              validate: () => ({
                isValid: true,
                type: 'Bitcoin',
                address: 'first-address',
                original: 'first-address',
              }),
            },
          ],
        },
        {
          predicate: () => true,
          validators: [
            {
              chain: 'Litecoin',
              validate: () => ({
                isValid: true,
                type: 'Litecoin',
                address: 'second-address',
                original: 'second-address',
              }),
            },
          ],
        },
      ];

      const res = evaluateRoutes('anything', routes);

      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.chains).toEqual(['Bitcoin', 'Litecoin']);
        expect(res.address).toBe('first-address');
      }
    });

    it('returns INTERNAL_ERROR for a matched route without validators', () => {
      const routes: Route[] = [{predicate: () => true, validators: []}];
      const res = evaluateRoutes('anything', routes);

      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INTERNAL_ERROR);
        expect(res.message).toBe('Internal validation error');
        expect(res.original).toBe('anything');
      }
    });

    it('maps a throwing predicate to INTERNAL_ERROR', () => {
      const routes: Route[] = [
        {
          predicate: () => {
            throw new Error('boom');
          },
          validators: [],
        },
      ];
      const res = evaluateRoutes('anything', routes);

      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INTERNAL_ERROR);
        expect(res.original).toBe('anything');
      }
    });

    it('maps a throwing validator to INTERNAL_ERROR', () => {
      const routes: Route[] = [
        {
          predicate: () => true,
          validators: [
            {
              chain: 'Bitcoin',
              validate: () => {
                throw new Error('boom');
              },
            },
          ],
        },
      ];
      const res = evaluateRoutes('anything', routes);

      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.code).toBe(ValidationErrorCodes.INTERNAL_ERROR);
        expect(res.original).toBe('anything');
      }
    });
  });
});

describe('validateAnyBatch', () => {
  it('processes a mix of valid and invalid items', () => {
    const results = validateAnyBatch([
      VALID_ETH,
      'garbage',
      {address: VALID_BTC_BECH32, id: 'btc-field'},
      INVALID_EVM_CHECKSUM,
    ]);

    expect(results).toHaveLength(4);

    // ETH
    expect(results[0].isValid).toBe(true);
    if (results[0].isValid) {
      expect(results[0].chains).toContain('Ethereum');
      expect(results[0].index).toBe(0);
      expect(results[0].id).toBeUndefined();
      expect(results[0].original).toBe(VALID_ETH);
    }

    // garbage
    expect(results[1].isValid).toBe(false);
    if (!results[1].isValid) {
      expect(results[1].code).toBe(ValidationErrorCodes.UNSUPPORTED_TYPE);
      expect(results[1].index).toBe(1);
      expect(results[1].original).toBe('garbage');
    }

    // BTC with id
    expect(results[2].isValid).toBe(true);
    if (results[2].isValid) {
      expect(results[2].chains).toEqual(['Bitcoin']);
      expect(results[2].id).toBe('btc-field');
      expect(results[2].original).toBe(VALID_BTC_BECH32);
    }

    // invalid EVM
    expect(results[3].isValid).toBe(false);
    if (!results[3].isValid) {
      expect(results[3].code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
      expect(results[3].index).toBe(3);
      expect(results[3].original).toBe(INVALID_EVM_CHECKSUM);
    }
  });

  it('handles malformed batch items gracefully', () => {
    const results = validateAnyBatch([
      null,
      undefined,
      {},
      {address: undefined, id: 1},
      {address: 42, id: 2},
    ] as any);
    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(r.isValid).toBe(false);
      if (!r.isValid) {
        expect(r.code).toBe(ValidationErrorCodes.EMPTY);
        expect(r.original).toBe('');
      }
    });
    expect(results[3].id).toBe(1);
    expect(results[4].id).toBe(2);
  });

  it('trims the original input', () => {
    const results = validateAnyBatch([`  ${VALID_ETH}  `]);
    expect(results[0].original).toBe(VALID_ETH);
  });

  it('returns chain-specific failures with the trimmed original', () => {
    const [result] = validateAnyBatch([`  ${INVALID_LTC_P2PKH}  `]);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe(ValidationErrorCodes.INVALID_CHECKSUM);
      expect(result.message).toBe('Checksum mismatch');
      expect(result.original).toBe(INVALID_LTC_P2PKH);
      expect(result.index).toBe(0);
    }
  });

  it('keeps single and batch original consistent', () => {
    const input = `  ${VALID_ETH}  `;
    const single = validateAny(input);
    const [batched] = validateAnyBatch([input]);

    expect(single.isValid).toBe(true);
    expect(batched.isValid).toBe(true);
    expect(batched.original).toBe(single.original);
    expect(batched.original).toBe(VALID_ETH);
  });

  it('omits id for strings and includes it for objects', () => {
    const results = validateAnyBatch(['x', {address: 'y', id: 'field'}]);
    expect(Object.hasOwn(results[0], 'id')).toBe(false);
    expect(Object.hasOwn(results[1], 'id')).toBe(true);
    expect(results[1].id).toBe('field');
  });

  it('ignores invalid id types', () => {
    const results = validateAnyBatch([{address: 'x', id: true as never}]);
    expect(results[0].id).toBeUndefined();
    expect(Object.hasOwn(results[0], 'id')).toBe(false);
  });

  it('throws a TypeError for non-array input', () => {
    expect(() => validateAnyBatch('not-an-array' as any)).toThrow(TypeError);
  });
});
