import type {
  AnyBatchValidationResult,
  AnyValidationResult,
} from '../../src/any/types';
import type {
  BatchItem,
  BatchValidationResult,
  ValidationResult,
} from '../../src/types';
import type {ValidationOutcome} from '../../src/utils/createValidator';
import type {BNBAddressType, BNBValidationResult} from '../../src/chains/bnb';
import type {
  BTCValidationResult,
  BitcoinAddressType,
} from '../../src/chains/btc';
import type {
  ETHValidationResult,
  EthereumAddressType,
} from '../../src/chains/eth';
import type {
  LTCValidationResult,
  LitecoinAddressType,
} from '../../src/chains/ltc';
import type {
  PolygonAddressType,
  PolygonValidationResult,
} from '../../src/chains/polygon';
import type {
  SOLValidationResult,
  SolanaAddressType,
} from '../../src/chains/sol';
import type {TONAddressType, TONValidationResult} from '../../src/chains/ton';
import type {TronAddressType, TronValidationResult} from '../../src/chains/trx';
import type {
  StellarAddressType,
  XLMValidationResult,
} from '../../src/chains/xlm';
import type {XRPAddressType, XRPValidationResult} from '../../src/chains/xrp';
import type {
  USDTBEP20AddressType,
  USDTBEP20ValidationResult,
} from '../../src/aliases/usdt-bep20';
import type {
  USDTERC20AddressType,
  USDTERC20ValidationResult,
} from '../../src/aliases/usdt-erc20';
import type {
  USDTTRC20AddressType,
  USDTTRC20ValidationResult,
} from '../../src/aliases/usdt-trc20';

import {describe, it, expect, expectTypeOf} from 'vite-plus/test';

import {validateAny, validateAnyBatch} from '../../src/any';
import {
  validateBNB,
  validateBNBBatch,
  validateBEP20,
  validateBEP20Batch,
} from '../../src/chains/bnb';
import {validateBTC, validateBTCBatch} from '../../src/chains/btc';
import {
  validateERC20,
  validateERC20Batch,
  validateETH,
  validateETHBatch,
} from '../../src/chains/eth';
import {validateLTC, validateLTCBatch} from '../../src/chains/ltc';
import {
  validateMatic,
  validateMaticBatch,
  validatePolygon,
  validatePolygonBatch,
} from '../../src/chains/polygon';
import {validateSOL, validateSOLBatch} from '../../src/chains/sol';
import {validateTON, validateTONBatch} from '../../src/chains/ton';
import {
  validateTRC20,
  validateTRC20Batch,
  validateTRX,
  validateTRXBatch,
} from '../../src/chains/trx';
import {validateXLM, validateXLMBatch} from '../../src/chains/xlm';
import {validateXRP, validateXRPBatch} from '../../src/chains/xrp';
import {
  validateUSDTBEP20,
  validateUSDTBEP20Batch,
} from '../../src/aliases/usdt-bep20';
import {
  validateUSDTERC20,
  validateUSDTERC20Batch,
} from '../../src/aliases/usdt-erc20';
import {
  validateUSDTTRC20,
  validateUSDTTRC20Batch,
} from '../../src/aliases/usdt-trc20';

describe('result type contracts', () => {
  it('keeps every exported result alias equal to its validator return type', () => {
    expectTypeOf(validateBTC).toEqualTypeOf<
      (address: string) => BTCValidationResult
    >();
    expectTypeOf(validateLTC).toEqualTypeOf<
      (address: string) => LTCValidationResult
    >();
    expectTypeOf(validateETH).toEqualTypeOf<
      (address: string) => ETHValidationResult
    >();
    expectTypeOf(validateBNB).toEqualTypeOf<
      (address: string) => BNBValidationResult
    >();
    expectTypeOf(validatePolygon).toEqualTypeOf<
      (address: string) => PolygonValidationResult
    >();
    expectTypeOf(validateSOL).toEqualTypeOf<
      (address: string) => SOLValidationResult
    >();
    expectTypeOf(validateTRX).toEqualTypeOf<
      (address: string) => TronValidationResult
    >();
    expectTypeOf(validateXRP).toEqualTypeOf<
      (address: string) => XRPValidationResult
    >();
    expectTypeOf(validateXLM).toEqualTypeOf<
      (address: string) => XLMValidationResult
    >();
    expectTypeOf(validateTON).toEqualTypeOf<
      (address: string) => TONValidationResult
    >();
    expectTypeOf(validateUSDTERC20).toEqualTypeOf<
      (address: string) => USDTERC20ValidationResult
    >();
    expectTypeOf(validateUSDTBEP20).toEqualTypeOf<
      (address: string) => USDTBEP20ValidationResult
    >();
    expectTypeOf(validateUSDTTRC20).toEqualTypeOf<
      (address: string) => USDTTRC20ValidationResult
    >();
  });

  it('pins the token and network aliases to their base chain types', () => {
    expectTypeOf(validateERC20).toEqualTypeOf<
      (address: string) => ETHValidationResult
    >();
    expectTypeOf(validateBEP20).toEqualTypeOf<
      (address: string) => BNBValidationResult
    >();
    expectTypeOf(validateTRC20).toEqualTypeOf<
      (address: string) => TronValidationResult
    >();
    expectTypeOf(validateMatic).toEqualTypeOf<
      (address: string) => PolygonValidationResult
    >();
  });

  it('pins every public batch alias to its chain result type', () => {
    expectTypeOf(validateBTCBatch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<BitcoinAddressType>[]
    >();
    expectTypeOf(validateBNBBatch).toEqualTypeOf<
      (items: readonly BatchItem[]) => BatchValidationResult<BNBAddressType>[]
    >();
    expectTypeOf(validateETHBatch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<EthereumAddressType>[]
    >();
    expectTypeOf(validateLTCBatch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<LitecoinAddressType>[]
    >();
    expectTypeOf(validatePolygonBatch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<PolygonAddressType>[]
    >();
    expectTypeOf(validateSOLBatch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<SolanaAddressType>[]
    >();
    expectTypeOf(validateTONBatch).toEqualTypeOf<
      (items: readonly BatchItem[]) => BatchValidationResult<TONAddressType>[]
    >();
    expectTypeOf(validateTRXBatch).toEqualTypeOf<
      (items: readonly BatchItem[]) => BatchValidationResult<TronAddressType>[]
    >();
    expectTypeOf(validateXLMBatch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<StellarAddressType>[]
    >();
    expectTypeOf(validateXRPBatch).toEqualTypeOf<
      (items: readonly BatchItem[]) => BatchValidationResult<XRPAddressType>[]
    >();
    expectTypeOf(validateERC20Batch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<EthereumAddressType>[]
    >();
    expectTypeOf(validateBEP20Batch).toEqualTypeOf<
      (items: readonly BatchItem[]) => BatchValidationResult<BNBAddressType>[]
    >();
    expectTypeOf(validateTRC20Batch).toEqualTypeOf<
      (items: readonly BatchItem[]) => BatchValidationResult<TronAddressType>[]
    >();
    expectTypeOf(validateMaticBatch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<PolygonAddressType>[]
    >();
    expectTypeOf(validateUSDTERC20Batch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<USDTERC20AddressType>[]
    >();
    expectTypeOf(validateUSDTBEP20Batch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<USDTBEP20AddressType>[]
    >();
    expectTypeOf(validateUSDTTRC20Batch).toEqualTypeOf<
      (
        items: readonly BatchItem[]
      ) => BatchValidationResult<USDTTRC20AddressType>[]
    >();
    expectTypeOf(validateAny).toEqualTypeOf<
      (address: string) => AnyValidationResult
    >();
    expectTypeOf(validateAnyBatch).toEqualTypeOf<
      (items: readonly BatchItem[]) => AnyBatchValidationResult[]
    >();
  });

  it('keeps the router chains field source-compatible as string[]', () => {
    const chains: Extract<AnyValidationResult, {isValid: true}>['chains'] = [];
    expectTypeOf(chains).toEqualTypeOf<string[]>();
  });

  it('disallows original on the pre-factory validator outcome', () => {
    const withOriginal: ValidationResult<'X'> = {
      isValid: true,
      type: 'X',
      address: 'x',
      original: 'x',
    };

    // @ts-expect-error ValidationOutcome must stay free of `original`.
    const outcome: ValidationOutcome<'X'> = withOriginal;
    expect(outcome).toBe(withOriginal);

    const payload: ValidationOutcome<'X'> = {
      isValid: false,
      code: 'INVALID_FORMAT',
      message: 'bad',
    };
    expect(payload.isValid).toBe(false);
  });

  it('disallows original on the failure outcome', () => {
    const failureWithOriginal: Extract<
      ValidationResult<'X'>,
      {isValid: false}
    > = {
      isValid: false,
      code: 'INVALID_FORMAT',
      message: 'bad',
      original: 'x',
    };

    // @ts-expect-error ValidationOutcome must stay free of `original`.
    const outcome: ValidationOutcome<'X'> = failureWithOriginal;
    expect(outcome).toBe(failureWithOriginal);
  });
});
