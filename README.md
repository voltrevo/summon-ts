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

  // for boolean circuits: summon.compileBoolean('/src/main.ts', 8, { ... })
  // (replace 8 with your desired uint precision)
  const { circuit, diagnostics } = summon.compile('/src/main.ts', {
    // In a real project you should be able to include these as regular files,
    // but how those files find their way into this format depends on your build
    // tool.
    // Example: https://github.com/voltrevo/mpc-hello/blob/c1c8092/src/getCircuitFiles.ts

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

  // May include non-error diagnostics.
  // (If there are errors, summon.compile will throw instead.)
  console.log(diagnostics);
  // { './circuit/main.ts': [] }

  // See mpc-framework for doing MPC with your circuits.
  // https://github.com/voltrevo/mpc-framework
}

// When summon.compile throws, the error message will be the first error
// diagnostic. The remaining diagnostics are also available as error.diagnostics
// and the compiled circuit might also be available as .circuit.
main().catch(console.error);
```

When providing `files` to the API, you can also substitute a file reader `(filePath: string) => string`. Like this:

```ts
summon.compile('/full/path/to/main.ts', filePath => fs.readFileSync(filePath));
```

## Development

Build with `npm run build`. This will compile the wasm subproject and also
transpile typescript into javascript. [Rust toolchain](https://rustup.rs/)
required.

Test with `npm test`.

## Example Projects

- [MPC Hello](https://voltrevo.github.io/mpc-hello/)
- [2PC is for Lovers](https://voltrevo.github.io/2pc-is-for-lovers/)
