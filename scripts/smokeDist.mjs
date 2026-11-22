import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const VALID_BTC_ADDRESS = '1BoatSLRHtKNngkdXEeobR76b53LETtpyT';

/**
 * @param {{validateBTC: (address: string) => {isValid: boolean, type?: string}}} mod
 * @param {string} label
 */
function assertBtcValidator(mod, label) {
  assert.equal(
    typeof mod.validateBTC,
    'function',
    `${label}: validateBTC must be a function`
  );

  const result = mod.validateBTC(VALID_BTC_ADDRESS);

  assert.equal(result.isValid, true, `${label}: valid address must pass`);
  assert.equal(result.type, 'P2PKH', `${label}: type must be P2PKH`);
}

/**
 * @param {{ValidationErrorCodes: Record<string, string>}} mod
 * @param {string} label
 */
function assertConstants(mod, label) {
  assert.equal(
    mod.ValidationErrorCodes.EMPTY,
    'EMPTY',
    `${label}: ValidationErrorCodes.EMPTY must be "EMPTY"`
  );
  assert.equal(
    mod.ValidationErrorCodes.INVALID_CHECKSUM,
    'INVALID_CHECKSUM',
    `${label}: ValidationErrorCodes.INVALID_CHECKSUM must be "INVALID_CHECKSUM"`
  );
}

const esmIndex = await import('../dist/index.mjs');
const esmBtc = await import('../dist/btc.mjs');
const cjsIndex = require('../dist/index.cjs');
const cjsBtc = require('../dist/btc.cjs');

assertBtcValidator(esmIndex, 'ESM index');
assertBtcValidator(esmBtc, 'ESM btc subpath');
assertBtcValidator(cjsIndex, 'CJS index');
assertBtcValidator(cjsBtc, 'CJS btc subpath');

const esmPackage = await import('cryptovalid');
const esmPackageBtc = await import('cryptovalid/btc');
const esmPackageConstants = await import('cryptovalid/constants');
const cjsPackage = require('cryptovalid');
const cjsPackageBtc = require('cryptovalid/btc');
const cjsPackageConstants = require('cryptovalid/constants');

assertBtcValidator(esmPackage, 'ESM package root');
assertBtcValidator(esmPackageBtc, 'ESM package btc subpath');
assertBtcValidator(cjsPackage, 'CJS package root');
assertBtcValidator(cjsPackageBtc, 'CJS package btc subpath');
assertConstants(esmPackage, 'ESM package root');
assertConstants(cjsPackage, 'CJS package root');
assertConstants(esmPackageConstants, 'ESM package constants subpath');
assertConstants(cjsPackageConstants, 'CJS package constants subpath');
assert.equal(
  esmPackage.ValidationErrorCodes,
  esmPackageConstants.ValidationErrorCodes,
  'ESM: root and constants subpath must expose the same object'
);
assert.equal(
  cjsPackage.ValidationErrorCodes,
  cjsPackageConstants.ValidationErrorCodes,
  'CJS: root and constants subpath must expose the same object'
);

// Built declaration resolution is covered by `scripts/checkDistTypes.mjs`.
console.log('dist smoke test passed (ESM + CJS, root + btc + constants)');
