import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';

const pkg = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8')
);

const requiredNodeMajor = pkg.engines.node.match(/\d+/)[0];
const requiredPnpmMajor = pkg.engines.pnpm.match(/\d+/)[0];

const [nodeMajor] = process.versions.node.split('.');
const nodeOk = nodeMajor === requiredNodeMajor;

let pnpmVersion = 'unknown';
try {
  pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
} catch {}
const [pnpmMajor] = pnpmVersion.split('.');
const pnpmOk = pnpmMajor === requiredPnpmMajor;

if (!nodeOk || !pnpmOk) {
  console.error(`
Error: Unsupported toolchain.
  Required: Node ${requiredNodeMajor} (${pkg.engines.node}), pnpm ${requiredPnpmMajor} (${pkg.engines.pnpm})
  Current:  Node v${process.versions.node}, pnpm ${pnpmVersion}

Switch to the correct versions and re-run pnpm install.
`);
  process.exit(1);
}
