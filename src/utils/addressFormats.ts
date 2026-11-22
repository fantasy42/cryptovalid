/**
 * Format predicates for the omnibox router.
 *
 * Each predicate is a cheap superset of the formats its chain validator
 * accepts. It may accept strings that later fail length, encoding, version, or
 * checksum checks; it must never reject an address the validator would accept.
 *
 * Keep these predicates aligned with the validators when adding or changing an
 * address format. `tests/any.test.ts` and `addressFormats.test.ts` cover the
 * known valid formats so a drift is caught before release.
 */

const EVM_REGEX = /^0[xX][0-9a-fA-F]{40}$/;
const SOLANA_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const LTC_BASE58_REGEX = /^[LM3][1-9A-HJ-NP-Za-km-z]{25,34}$/;
const TRON_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const XRP_REGEX =
  /^(?:r[1-9A-HJ-NP-Za-km-z]{24,34}|X[1-9A-HJ-NP-Za-km-z]{28,58})$/;
const STELLAR_REGEX = /^(?:G[A-Z2-7]{55}|M[A-Z2-7]{68})$/;
const TON_REGEX = /^(?:-?\d+:[0-9a-fA-F]{64}|[A-Za-z0-9+/_-]{48})$/;

/**
 * Returns whether `address` has an EVM address shape (`0x`/`0X` + 40 hex).
 */
export function isEVMAddress(address: string): boolean {
  return EVM_REGEX.test(address);
}

/**
 * Returns whether `address` has a Bitcoin address shape.
 */
export function isBitcoinAddress(address: string): boolean {
  const lower = address.toLowerCase();
  return (
    lower.startsWith('bc1') ||
    address.startsWith('1') ||
    address.startsWith('3')
  );
}

/**
 * Returns whether `address` has a Litecoin address shape.
 *
 * Bech32/Bech32m addresses are matched by HRP. Base58 P2PKH/P2SH addresses
 * use the `L`, `M`, and shared `3` prefixes and are 34 characters for their
 * 25-byte payloads; the length/charset check keeps this a superset without
 * matching longer `M...` Stellar (69) or TON (48) addresses.
 */
export function isLitecoinAddress(address: string): boolean {
  const lower = address.toLowerCase();
  return lower.startsWith('ltc1') || LTC_BASE58_REGEX.test(address);
}

/**
 * Returns whether `address` has a Solana address shape.
 */
export function isSolanaAddress(address: string): boolean {
  return SOLANA_REGEX.test(address);
}

/**
 * Returns whether `address` has a TRON address shape.
 */
export function isTronAddress(address: string): boolean {
  return TRON_REGEX.test(address);
}

/**
 * Returns whether `address` has an XRP classic or X-address shape.
 */
export function isXRPAddress(address: string): boolean {
  return XRP_REGEX.test(address);
}

/**
 * Returns whether `address` has a Stellar account or muxed address shape.
 */
export function isStellarAddress(address: string): boolean {
  return STELLAR_REGEX.test(address);
}

/**
 * Returns whether `address` has a TON raw or user-friendly address shape.
 */
export function isTONAddress(address: string): boolean {
  return TON_REGEX.test(address);
}
