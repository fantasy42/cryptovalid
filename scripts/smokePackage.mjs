import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('cryptovalid/package.json');

assert.ok(
  pkg.exports && typeof pkg.exports === 'object',
  'cryptovalid must expose an exports map'
);

// Keep in sync with scripts/entries.ts. This is the published contract, not a
// mirror of whatever the tarball happens to contain.
const EXPECTED_SUBPATHS = [
  '.',
  './any',
  './constants',
  './bnb',
  './btc',
  './eth',
  './ltc',
  './polygon',
  './sol',
  './ton',
  './trx',
  './xlm',
  './xrp',
  './usdt-bep20',
  './usdt-erc20',
  './usdt-trc20',
].sort();

const subpaths = Object.keys(pkg.exports).filter(
  (subpath) => subpath !== './package.json'
);

assert.deepEqual(
  subpaths.slice().sort(),
  EXPECTED_SUBPATHS,
  'cryptovalid must expose every expected subpath'
);

for (const subpath of subpaths) {
  const specifier =
    subpath === '.' ? 'cryptovalid' : `cryptovalid/${subpath.slice(2)}`;
  const esm = await import(specifier);
  const cjs = require(specifier);
  const esmKeys = Object.keys(esm).sort();
  const cjsKeys = Object.keys(cjs).sort();

  assert.ok(esmKeys.length > 0, `${specifier} must expose runtime values`);
  assert.deepEqual(
    cjsKeys,
    esmKeys,
    `${specifier} must expose the same values from ESM and CJS`
  );
}

const root = await import('cryptovalid');
const rootCjs = require('cryptovalid');
const constants = await import('cryptovalid/constants');
const constantsCjs = require('cryptovalid/constants');
const any = await import('cryptovalid/any');

const VALID_BTC = '1BoatSLRHtKNngkdXEeobR76b53LETtpyT';
const VALID_ETH = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

assert.equal(typeof root.validateBTC, 'function');
assert.equal(typeof rootCjs.validateBTC, 'function');
assert.equal(root.validateBTC(VALID_BTC).isValid, true);
assert.equal(rootCjs.validateBTC(VALID_BTC).isValid, true);
assert.equal(root.ValidationErrorCodes, constants.ValidationErrorCodes);
assert.equal(rootCjs.ValidationErrorCodes, constantsCjs.ValidationErrorCodes);
assert.equal(typeof any.validateAny, 'function');
assert.equal(any.validateAny(VALID_ETH).isValid, true);
assert.equal(
  Object.hasOwn(root, 'validateAny'),
  false,
  'the root entry must not expose the router'
);
assert.equal(
  Object.hasOwn(rootCjs, 'validateAny'),
  false,
  'the CJS root entry must not expose the router'
);

console.log(`package smoke passed (${subpaths.length} subpaths, ESM + CJS)`);
