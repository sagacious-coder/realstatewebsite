import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOpenApiDocument } from './generate-openapi.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractsDir = path.resolve(__dirname, '..');
const committedPath = path.join(contractsDir, 'openapi.json');

if (!fs.existsSync(committedPath)) {
  console.error(`ERROR: openapi.json does not exist at ${committedPath}. Run "pnpm contracts:openapi" to generate it.`);
  process.exit(1);
}

const committedContent = fs.readFileSync(committedPath, 'utf8');
const generatedContent = JSON.stringify(buildOpenApiDocument(), null, 2) + '\n';

if (committedContent !== generatedContent) {
  console.error('ERROR: openapi.json is out of date with the contracts builder. Run "pnpm contracts:openapi" and commit the updated file.');
  process.exit(1);
}

console.log('✓ openapi.json is up to date with contracts builder.');
process.exit(0);

