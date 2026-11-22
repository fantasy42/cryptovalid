/**
 * Verifies the built declarations expose the public constants API from both
 * the root entry and the `cryptovalid/constants` subpath, in ESM and CJS
 * resolution modes.
 *
 * Run after `vp pack`; `vp run build` invokes this automatically.
 */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const TSC_PATH = path.join(
  ROOT_DIR,
  'node_modules',
  'typescript',
  'bin',
  'tsc'
);

const CONSUMER = `import {
  ValidationErrorCodes as RootCodes,
  type ValidationErrorCode as RootCode,
} from 'cryptovalid';
import {
  ValidationErrorCodes as SubCodes,
  type ValidationErrorCode as SubCode,
} from 'cryptovalid/constants';

const rootCode: RootCode = RootCodes.EMPTY;
const subCode: SubCode = SubCodes.EMPTY;
const rootFromSub: RootCode = subCode;
const subFromRoot: SubCode = rootCode;
const rootObjectFromSub: typeof RootCodes = SubCodes;
const subObjectFromRoot: typeof SubCodes = RootCodes;

// @ts-expect-error - error codes are a closed union, not arbitrary strings
const invalidRootCode: RootCode = 'NOT_A_CODE';
// @ts-expect-error - error codes are a closed union, not arbitrary strings
const invalidSubCode: SubCode = 'NOT_A_CODE';

void [
  rootFromSub,
  subFromRoot,
  rootObjectFromSub,
  subObjectFromRoot,
  invalidRootCode,
  invalidSubCode,
];
`;

const TSCONFIG = {
  compilerOptions: {
    target: 'ES2022',
    module: 'Node16',
    moduleResolution: 'Node16',
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    types: [],
  },
  include: ['consumer.mts', 'consumer.cts'],
};

async function main() {
  if (!existsSync(TSC_PATH)) {
    throw new Error(`TypeScript CLI not found at ${TSC_PATH}.`);
  }

  const tempDir = await mkdtemp(path.join(ROOT_DIR, '.tmp-dist-types-'));

  try {
    await Promise.all([
      writeFile(path.join(tempDir, 'consumer.mts'), CONSUMER, 'utf8'),
      writeFile(path.join(tempDir, 'consumer.cts'), CONSUMER, 'utf8'),
      writeFile(
        path.join(tempDir, 'tsconfig.json'),
        `${JSON.stringify(TSCONFIG, null, 2)}\n`,
        'utf8'
      ),
    ]);

    const result = spawnSync(
      process.execPath,
      [TSC_PATH, '-p', path.join(tempDir, 'tsconfig.json')],
      {cwd: ROOT_DIR, stdio: 'inherit'}
    );

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(
        `Built type check failed with exit code ${result.status ?? 'unknown'}.`
      );
    }
  } finally {
    await rm(tempDir, {recursive: true, force: true});
  }

  console.log(
    '✅ Built type exports verified (ESM + CJS, root + constants subpath).'
  );
}

try {
  await main();
} catch (error) {
  console.error('Failed to verify built type exports:', error);
  process.exitCode = 1;
}
