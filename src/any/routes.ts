import type {ValidationFailure, ValidationResult} from '../types';
import type {AnyValidationResult, SupportedChain} from './types';

import {
  isBitcoinAddress,
  isEVMAddress,
  isLitecoinAddress,
  isSolanaAddress,
  isStellarAddress,
  isTONAddress,
  isTronAddress,
  isXRPAddress,
} from '../utils/addressFormats';
import {ValidationErrorCodes} from '../constants';
import {validatePolygon} from '../chains/polygon';
import {validateBTC} from '../chains/btc';
import {validateETH} from '../chains/eth';
import {validateBNB} from '../chains/bnb';
import {validateSOL} from '../chains/sol';
import {validateTRX} from '../chains/trx';
import {validateXRP} from '../chains/xrp';
import {validateLTC} from '../chains/ltc';
import {validateXLM} from '../chains/xlm';
import {validateTON} from '../chains/ton';

interface ValidatorEntry {
  chain: SupportedChain;
  validate: (addr: string) => ValidationResult<string>;
}

export interface Route {
  predicate: (addr: string) => boolean;
  validators: readonly ValidatorEntry[];
}

/**
 * Evaluates a prevalidated, trimmed address against the supplied routes.
 *
 * Every matching route is evaluated; there is no short-circuiting, so an
 * address can be reported as valid on multiple chains. Internal errors thrown
 * by a predicate or validator are mapped to `INTERNAL_ERROR`, matching the
 * single-validator factory.
 *
 * @param address - A prevalidated, trimmed address.
 * @param routes  - Ordered route table to evaluate.
 * @returns The router result with all matching chains or the first failure.
 */
export function evaluateRoutes(
  address: string,
  routes: readonly Route[]
): AnyValidationResult {
  try {
    const chains: SupportedChain[] = [];
    let firstFailure: ValidationFailure | undefined;
    let anyRouteMatched = false;
    let normalizedAddress = address;

    for (const route of routes) {
      if (!route.predicate(address)) {
        continue;
      }
      anyRouteMatched = true;

      for (const {chain, validate} of route.validators) {
        const result = validate(address);

        if (result.isValid) {
          chains.push(chain);
          if (chains.length === 1) {
            normalizedAddress = result.address;
          }
        } else if (!firstFailure) {
          firstFailure = {
            isValid: false,
            code: result.code,
            message: result.message,
          };
        }
      }
    }

    if (chains.length > 0) {
      return {
        isValid: true,
        chains,
        address: normalizedAddress,
        original: address,
      };
    }

    if (!anyRouteMatched) {
      return {
        isValid: false,
        code: ValidationErrorCodes.UNSUPPORTED_TYPE,
        message: 'Address format not recognized',
        original: address,
      };
    }

    return firstFailure
      ? {...firstFailure, original: address}
      : internalFailure(address);
  } catch {
    return internalFailure(address);
  }
}

function internalFailure(original: string): AnyValidationResult {
  return {
    isValid: false,
    code: ValidationErrorCodes.INTERNAL_ERROR,
    message: 'Internal validation error',
    original,
  };
}

/**
 * Route table, ordered most-specific first.
 *
 * Predicates intentionally overlap: every matching route is evaluated, so a
 * `3...` P2SH address is valid on both Bitcoin and Litecoin. The broad Solana
 * shape is checked last so its failure cannot mask a more specific chain's
 * error. See `addressFormats.ts` for the predicate definitions.
 */
export const ROUTES: readonly Route[] = [
  // EVM family – most common, checked first
  {
    predicate: isEVMAddress,
    validators: [
      {chain: 'Ethereum', validate: validateETH},
      {chain: 'BNB', validate: validateBNB},
      {chain: 'Polygon', validate: validatePolygon},
    ],
  },
  {
    predicate: isBitcoinAddress,
    validators: [{chain: 'Bitcoin', validate: validateBTC}],
  },
  {
    predicate: isLitecoinAddress,
    validators: [{chain: 'Litecoin', validate: validateLTC}],
  },
  {
    predicate: isTronAddress,
    validators: [{chain: 'TRON', validate: validateTRX}],
  },
  {
    predicate: isXRPAddress,
    validators: [{chain: 'XRP', validate: validateXRP}],
  },
  {
    predicate: isStellarAddress,
    validators: [{chain: 'Stellar', validate: validateXLM}],
  },
  {
    predicate: isTONAddress,
    validators: [{chain: 'TON', validate: validateTON}],
  },
  // Broadest Base58 shape; keep last so it does not win failure precedence.
  {
    predicate: isSolanaAddress,
    validators: [{chain: 'Solana', validate: validateSOL}],
  },
];
