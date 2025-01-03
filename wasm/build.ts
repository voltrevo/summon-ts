import { spawn } from 'child_process';
import fs from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.chdir(__dirname);

main().catch(e => {
  console.error(e);
  process.exit(1);
});

async function main() {
  await shell('wasm-pack', ['build', '--target=web']);

  const wasmBinary = await fs.readFile('./pkg/summon_ts_wasm_bg.wasm');
  const src = `export default '${wasmBinary.toString('base64')}';\n`;

  await fs.unlink('./pkg/summon_ts_wasm_bg.wasm');

  // nextjs tries to statically resolve this and fails, but we don't use it
  await replaceInFile(
    './pkg/summon_ts_wasm.js',
    `input = new URL('summon_ts_wasm_bg.wasm', import.meta.url);`,
    `throw new Error('not supported')`,
  );

  await fs.writeFile('./pkg/summon_ts_wasm_base64.js', src);
  await fs.unlink('./pkg/.gitignore');
  await fs.rename('./pkg', '../srcWasm');
}

async function shell(program: string, args: string[]) {
  const child = spawn(program, args, { stdio: 'inherit' });

  await new Promise<void>((resolve, reject) => {
    child.on('exit', code => {
      if (code !== 0) {
        reject(new Error(
          `Failed shell command (code=${code}): ${[program, ...args].join(' ')}`
        ));
      } else {
        resolve();
      }
    });
  });
}

async function replaceInFile(path: string, search: string, replace: string) {
  const content = await fs.readFile(path, 'utf-8');
  const parts = content.split(search);

  if (parts.length === 1) {
    throw new Error(`Search string not found in file: ${search}`);
  }

  const updatedContent = parts.join(replace);

  await fs.writeFile(path, updatedContent, 'utf-8');
}
