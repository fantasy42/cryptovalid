import {spawnSync} from 'node:child_process';
import {cp, mkdtemp, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SMOKE_SCRIPT = path.join(SCRIPT_DIR, 'smokePackage.mjs');
const PACKAGE_NAME = './cryptovalid.tgz';
const NPM_TIMEOUT_MS = 180_000;
const NODE_TIMEOUT_MS = 120_000;

function assertSuccess(command, result) {
  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} exited with code ${result.status ?? 'unknown'}`
    );
  }
}

function runNpm(args, cwd) {
  if (process.platform === 'win32') {
    // Windows needs a shell for npm.cmd. The argument list is fixed here, so
    // the command string is safe and avoids child_process's shell-args warning.
    const command = `npm ${args.join(' ')}`;
    assertSuccess(
      'npm',
      spawnSync(command, {
        cwd,
        stdio: 'inherit',
        shell: true,
        timeout: NPM_TIMEOUT_MS,
      })
    );
    return;
  }

  assertSuccess(
    'npm',
    spawnSync('npm', args, {
      cwd,
      stdio: 'inherit',
      timeout: NPM_TIMEOUT_MS,
    })
  );
}

function runNode(script, cwd) {
  assertSuccess(
    process.execPath,
    spawnSync(process.execPath, [script], {
      cwd,
      stdio: 'inherit',
      timeout: NODE_TIMEOUT_MS,
    })
  );
}

async function main() {
  const tarball = process.argv[2];

  if (!tarball) {
    throw new Error('Usage: node scripts/runPackageSmoke.mjs <tarball>');
  }

  const consumerDir = await mkdtemp(
    path.join(os.tmpdir(), 'cryptovalid-consumer-')
  );

  try {
    await writeFile(
      path.join(consumerDir, 'package.json'),
      `${JSON.stringify(
        {name: 'cryptovalid-consumer', private: true, type: 'module'},
        null,
        2
      )}\n`
    );

    // Copy the tarball into the consumer so npm receives a path without
    // spaces, even when the runner's temporary directory contains spaces.
    await cp(path.resolve(tarball), path.join(consumerDir, 'cryptovalid.tgz'));

    runNpm(
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--no-package-lock',
        PACKAGE_NAME,
      ],
      consumerDir
    );

    await cp(SMOKE_SCRIPT, path.join(consumerDir, 'smokePackage.mjs'));
    runNode('smokePackage.mjs', consumerDir);
    console.log('✅ Packed package smoke test passed');
  } finally {
    await rm(consumerDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

try {
  await main();
} catch (error) {
  console.error('Failed to smoke test packed package:', error);
  process.exitCode = 1;
}
