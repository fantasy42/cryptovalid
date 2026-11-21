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
const cjsPackage = require('cryptovalid');
const cjsPackageBtc = require('cryptovalid/btc');

assertBtcValidator(esmPackage, 'ESM package root');
assertBtcValidator(esmPackageBtc, 'ESM package btc subpath');
assertBtcValidator(cjsPackage, 'CJS package root');
assertBtcValidator(cjsPackageBtc, 'CJS package btc subpath');

console.log('dist smoke test passed (ESM + CJS, direct + package exports)');
