/**
 * Waits for the Hardhat local node to be ready, then deploys contracts.
 * Contracts always deploy to the same deterministic addresses on Hardhat,
 * so .env.local addresses stay valid across restarts.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC_URL = 'http://127.0.0.1:8545';
const POLL_INTERVAL_MS = 600;
const MAX_WAIT_MS = 30_000;

async function isNodeReady() {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForNode() {
  const start = Date.now();
  process.stdout.write('[DEPLOY] Waiting for Hardhat node');
  while (Date.now() - start < MAX_WAIT_MS) {
    if (await isNodeReady()) {
      process.stdout.write(' ready.\n');
      return;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error('Hardhat node did not start within 30s.');
}

await waitForNode();

console.log('[DEPLOY] Deploying contracts to localhost...');
const blockchainDir = path.resolve(__dirname, '..', 'Blockchain');
execSync('npx hardhat run scripts/deploy.js --network localhost', {
  cwd: blockchainDir,
  stdio: 'inherit',
});
console.log('[DEPLOY] Contracts deployed. Addresses match .env.local — ready.');
