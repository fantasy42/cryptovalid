# cryptovalid &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fantasy42/cryptovalid/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/cryptovalid.svg?style=flat)](https://www.npmjs.com/package/cryptovalid) [![tests](https://github.com/fantasy42/cryptovalid/actions/workflows/test.yml/badge.svg)](https://github.com/fantasy42/cryptovalid/actions/workflows/test.yml)

**Lightweight crypto address validator for Bitcoin, Ethereum, Solana, and more.**

- **Stop bad addresses early** - Checksum-aware validation catches typos and malformed input before funds move.
- **Batch validation** - Validate many addresses at once while keeping the trimmed original input, index, and optional id.
- **Type-safe and fast** - Discriminated union results, synchronous validation, 500+ tests.
- **Tree-shakeable and small** - Per-chain entry points; import only what you need.

## Installation

```bash
npm install cryptovalid
```

## Requirements

- Node.js 22.12 or newer (`engines.node`).
- Modern browsers, workers, and edge runtimes via ESM.
- ESM and CommonJS builds, both with TypeScript types.

## Basic Usage

```ts
import {validateBTC} from 'cryptovalid';

const result = validateBTC('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');

// Success: {isValid: true, type: 'Bech32', address: 'bc1...', original: 'bc1...'}
// Failure: {isValid: false, code: 'INVALID_CHECKSUM', message: '...', original: 'bc1...'}

if (result.isValid) {
  console.log(`Valid ${result.type} address: ${result.address}`);
} else {
  console.error(`Validation failed: ${result.code} - ${result.message}`);
}
```

Validators trim surrounding whitespace and return failures as values; they do not throw on malformed addresses. `original` is the trimmed input. The TypeScript API accepts a string; at runtime, any non-string input returns `NULL_OR_UNDEFINED` with `original` set to an empty string.

On success, `address` is the validator's canonical form where one exists — lowercase for Bitcoin/Litecoin Bech32 and `0x` plus lowercase hex for EVM — otherwise it equals `original`. Batch helpers expect an array and throw a `TypeError` otherwise.

The root entry also exports the result building blocks `ValidationSuccess`, `ValidationFailure`, and `BatchResult`. The `cryptovalid/any` entry exports `AnyValidationResult`, `AnyBatchValidationResult`, and `SupportedChain` for typing router results and chain names.

## Module Formats

ESM is recommended for browsers, workers, edge runtimes, and modern Node:

```ts
import {validateBTC} from 'cryptovalid/btc';
```

CommonJS is supported on Node.js 22.12+:

```js
const {validateBTC} = require('cryptovalid/btc');
```

TypeScript resolves subpath types through the package `exports` map. Use `moduleResolution` `node16` or `nodenext` (with a matching `module` setting), or `bundler`; the legacy `node10` resolver does not see subpath types.

## Supported Chains

All validators listed below also have batch variants (`validateBTCBatch`, `validateETHBatch`, and so on).

| Chain        | Validators                         | Accepted formats                            | Integrity                    |
|--------------|------------------------------------|---------------------------------------------|------------------------------|
| **Bitcoin**  | `validateBTC`                      | P2PKH, P2SH, Bech32, Bech32m                | Base58Check / Bech32/Bech32m |
| **Ethereum** | `validateETH`, `validateERC20`     | `0x`/`0X` + 40 hex                           | EIP-55 (mixed case)          |
| **BNB**      | `validateBNB`, `validateBEP20`     | `0x`/`0X` + 40 hex                           | EIP-55 (mixed case)          |
| **Polygon**  | `validatePolygon`, `validateMatic` | `0x`/`0X` + 40 hex                           | EIP-55 (mixed case)          |
| **Solana**   | `validateSOL`                      | Base58, 32-byte key                         | None (format only)           |
| **TRON**     | `validateTRX`, `validateTRC20`     | Base58Check `T...`                          | Base58Check                  |
| **Litecoin** | `validateLTC`                      | P2PKH, P2SH, Bech32, Bech32m                | Base58Check / Bech32/Bech32m |
| **XRP**      | `validateXRP`                      | Classic `r...`, X-address `X...` (mainnet)  | Base58Check                  |
| **Stellar**  | `validateXLM`                      | `G...` standard, `M...` muxed               | CRC16-XModem                 |
| **TON**      | `validateTON`                      | Raw, user-friendly (mainnet/testnet)        | CRC16                        |

EIP-55 is verified only when an EVM address is mixed case. Lowercase and uppercase forms are accepted and normalized to lowercase on success.

Token aliases return the base chain's type: `validateUSDTERC20` returns `'Ethereum'`, `validateUSDTBEP20` returns `'BNB'`, and `validateUSDTTRC20` returns `'TRON'`.

## Batch Validation

Every validator has a batch counterpart (`validateBTCBatch`, `validateETHBatch`, and so on). Items can be plain strings or `{address, id}` objects:

```ts
import {validateETHBatch} from 'cryptovalid';

const results = validateETHBatch([
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  '0xinvalid',
  {address: '0x1234', id: 'field2'},
]);

results.forEach((r) => {
  if (r.isValid) {
    console.log(`[${r.index}] ${r.original} -> ${r.type}`);
  } else {
    console.error(`[${r.index}] ${r.original} -> ${r.code}: ${r.message}`);
  }
});
```

Each result includes the trimmed `original` input, its position (`index`), and the optional `id` you supplied. Malformed batch items (for example `null` or an object without a string `address`) are treated as empty strings and fail with `EMPTY`.

## Universal Validation (`validateAny`)

`validateAny` runs the matching chain validators and returns every chain that accepts the address. It is available only from `cryptovalid/any`, so single-chain imports do not include every validator.

```ts
import {validateAny} from 'cryptovalid/any';

const result = validateAny('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

if (result.isValid) {
  console.log(result.chains);  // ['Ethereum', 'BNB', 'Polygon']
  console.log(result.address); // first successful validator's normalized address
  console.log(result.original); // trimmed input
} else {
  console.error(`${result.code}: ${result.message}`);
}
```

EVM addresses match Ethereum, BNB, and Polygon. A `3...` P2SH address can match both Bitcoin and Litecoin. If you already know the chain, use the chain-specific validator: it is more direct, authoritative, and cheaper.

On failure, `result.code` is `UNSUPPORTED_TYPE` when no format matches, or the first chain error from a matching route, such as `INVALID_CHECKSUM`. A batch variant (`validateAnyBatch`) follows the same `{address, id}`, trimmed `original`, and `index` pattern as other batch validators.

## Error Codes

Every failure has a stable, machine-readable `code` and a human-readable `message`. The `code` is part of the API; the `message` may change, so do not parse it.

Import the codes and type from the dedicated subpath (the same exports are also available from the root entry):

```ts
import {
  ValidationErrorCodes,
  type ValidationErrorCode,
} from 'cryptovalid/constants';
```

Using `cryptovalid/constants` keeps chain-only consumers from pulling in the root entry just to switch on error codes.

### Available Error Codes

| Code                   | Meaning                                                                      |
|------------------------|------------------------------------------------------------------------------|
| `NULL_OR_UNDEFINED`    | Input was `null`, `undefined`, or not a string.                              |
| `EMPTY`                | Address was empty or only whitespace.                                        |
| `TOO_LONG`             | Address exceeds maximum length (256 chars).                                  |
| `INVALID_CHARACTERS`   | Contains control or non-ASCII characters.                                    |
| `INVALID_FORMAT`       | General format violation.                                                    |
| `INVALID_PREFIX`       | Missing or invalid prefix.                                                   |
| `INVALID_LENGTH`       | Wrong length for the address type.                                           |
| `INVALID_CHECKSUM`     | Checksum verification failed (Bech32, Base58Check, EIP-55, CRC16, etc.).     |
| `INVALID_VERSION`      | Invalid version byte or witness version.                                     |
| `INVALID_ENCODING`     | Invalid underlying encoding.                                                 |
| `MIXED_CASE`           | Mixed case where single case is required.                                    |
| `UNSUPPORTED_TYPE`     | Format not supported by this validator.                                      |
| `INTERNAL_ERROR`       | Unexpected internal error.                                                   |

### Usage Example

```ts
import {validateETH} from 'cryptovalid/eth';
import {ValidationErrorCodes} from 'cryptovalid/constants';

const result = validateETH(address);

if (!result.isValid) {
  switch (result.code) {
    case ValidationErrorCodes.INVALID_CHECKSUM:
      showChecksumError(result.message);
      break;

    case ValidationErrorCodes.INVALID_PREFIX:
      showPrefixError(result.message);
      break;

    default:
      showGenericError(result.message);
  }
}
```

You can also map codes to translations, icons, or severity levels.

## Modular Imports and Size

Use a chain subpath to keep bundles small:

```ts
import {validateBTC} from 'cryptovalid/btc';
import {validateUSDTTRC20} from 'cryptovalid/usdt-trc20';
```

With esbuild 0.27 (minified + gzip, dependencies included), a chain-specific entry is roughly **1.5-6 kB**, `cryptovalid/constants` is under **1 kB**, and the all-chain router is about **11 kB**. Exact sizes depend on your bundler; import only what you need.

## Performance

Validation is synchronous and does no I/O. Batch helpers process each item once, so cost scales linearly with input size. Measure on your target runtime for capacity planning.

## Security

This library performs offline format and checksum verification only. It does not guarantee that an address belongs to the intended recipient, verify on-chain activity, or handle private keys and seed phrases.

Checksum coverage varies by chain:

- Solana has no checksum. A typo that still decodes to 32 bytes will pass.
- EIP-55 is enforced only for mixed-case EVM input; lowercase and uppercase forms are accepted.
- A checksum-valid address can still be the wrong recipient. Verify the full address through a second channel, especially against address-poisoning attempts that mimic leading or trailing characters.

If you discover a security vulnerability, please follow the [Security Policy](.github/SECURITY.md) instead of opening a public issue.

## Contributing

Development happens in the open on GitHub, and contributions including bug fixes, improvements, and ideas are welcome.

Read the [contributing guide](.github/CONTRIBUTING.md) to learn about the development process, how to propose bug fixes and improvements, and how to build and test your changes.

### Code of Conduct

This project expects all participants to adhere to the project's [Code of Conduct](.github/CODE_OF_CONDUCT.md). Please read the full text so that you understand what actions will and will not be tolerated.

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [Fantasy](https://github.com/fantasy42)
