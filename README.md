# summon-ts

TypeScript build of the [Summon](https://github.com/voltrevo/summon) compiler
(via wasm).

## Usage

```sh
npm install summon-ts
```

```ts
import * as summon from 'summon-ts';

async function main() {
  await summon.init();

  const circuit = summon.compile('/src/main.ts', {
    // In a real project you should be able to include these as regular files,
    // but how those files find their way into this format depends on your build
    // tool.

    '/src/main.ts': `
      export default function main(a: number, b: number) {
        return a + b;
      }
    `,
  });

  console.log(circuit);
  // {
  //   bristol: '...',
  //   info: { ... },
  // }

  // See mpc-framework for doing MPC with your circuits.
  // https://github.com/voltrevo/mpc-framework
}

main().catch(console.error);
```

## Development

Build with `npm run build`. This will compile the wasm subproject and also
transpile typescript into javascript. [Rust toolchain](https://rustup.rs/)
required.

Test with `npm test`.

## Example Project

TODO
