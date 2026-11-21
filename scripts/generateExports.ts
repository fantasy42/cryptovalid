import {promises as fs} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {buildExports, getModules} from './buildExports.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

try {
  const pkgPath = path.resolve(rootDir, 'package.json');
  const pkgStr = await fs.readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgStr);

  const chains = await getModules(rootDir, 'chains');
  const aliases = await getModules(rootDir, 'aliases');

  pkg.exports = buildExports([...chains, ...aliases]);

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('✅ Generated named exports in package.json');
} catch (error) {
  throw new Error('Failed to generate exports in package.json', {
    cause: error,
  });
}
