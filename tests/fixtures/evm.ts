/**
 * Shared EVM address vectors used by more than one test suite.
 *
 * The official EIP-55 checksum reference vectors stay local to
 * `tests/utils/evm.test.ts` so their expected checksums remain explicit and
 * auditable. These are the common format-level values shared across suites.
 */

/** Valid, mixed-case EIP-55 checksummed address (vitalik.eth). */
export const EVM_VALID_CHECKSUMMED =
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

/** Lowercase form of {@link EVM_VALID_CHECKSUMMED}. */
export const EVM_VALID_LOWERCASE = EVM_VALID_CHECKSUMMED.toLowerCase();

/** All-uppercase hex with the canonical lowercase `0x` prefix. */
export const EVM_VALID_UPPERCASE = `0x${EVM_VALID_CHECKSUMMED.slice(2).toUpperCase()}`;

/** Uppercase `0X` prefix with the original mixed-case checksum. */
export const EVM_VALID_UPPERCASE_PREFIX = `0X${EVM_VALID_CHECKSUMMED.slice(2)}`;

/** Valid EIP-55 address with leading zero nibbles. */
export const EVM_VALID_LEADING_ZERO =
  '0x00006bF26964aF9D7eeD9E03E53415D37aA96045';

/** The zero address is a structurally valid 20-byte EVM address. */
export const EVM_ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

/** Mixed-case address with one letter cased incorrectly. */
export const EVM_INVALID_CHECKSUM_LETTER =
  '0xd8dA6bF26964aF9D7eEd9e03E53415D37aA96045';

/** Mixed-case address whose last digit differs; the checksum no longer matches. */
export const EVM_INVALID_CHECKSUM_DIGIT =
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96046';

/** Too short to be a 42-character EVM address. */
export const EVM_INVALID_LENGTH_SHORT =
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96';

/** Too long to be a 42-character EVM address. */
export const EVM_INVALID_LENGTH_LONG =
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA960451';

/** Correct length, but the second character is not `x`/`X`. */
export const EVM_INVALID_PREFIX = '0yd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

/** Correct length and prefix, but the hex body contains a non-hex character. */
export const EVM_INVALID_HEX = '0xG8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
