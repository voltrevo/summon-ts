# summon-ts

TypeScript build of the
[Summon](https://github.com/privacy-scaling-explorations/summon) compiler (via
wasm).

## Usage

```sh
npm install summon-ts
```

```ts
import * as summon from "summon-ts";

async function main() {
  await summon.init();

  const { circuit, diagnostics } = summon.compile({
    path: "/src/main.ts",
    // for boolean circuits:
    // boolifyWidth: 8, // (replace 8 with your desired uint precision)
    // if your circuit uses io.inputPublic(..) then provide the values like
    // this:
    // publicInputs: { N: 5 },
    files: {
      // In a real project you should be able to include these as regular files,
      // but how those files find their way into this format depends on your build
      // tool.
      // Example: https://github.com/privacy-scaling-explorations/mpc-hello/blob/c1c8092/src/getCircuitFiles.ts

      "/src/main.ts": `
        export default (io: Summon.IO) {
          const a = io.input('alice', 'a', summon.number());
          const b = io.input('bob', 'b', summon.number());

          io.outputPublic('res', a + b);
        }
      `,
    },
  });

  console.log(circuit);
  // {
  //   bristol: '...',
  //   info: { ... },
  //   mpcSettings: [...],
  // }

  // May include non-error diagnostics.
  // (If there are errors, summon.compile will throw instead.)
  console.log(diagnostics);
  // { './circuit/main.ts': [] }

  // See mpc-framework for doing MPC with your circuits.
  // https://github.com/privacy-scaling-explorations/mpc-framework
}

// When summon.compile throws, the error message will be the first error
// diagnostic. The remaining diagnostics are also available as error.diagnostics
// and the compiled circuit might also be available as .circuit.
main().catch(console.error);
```

When providing files to the API, you can also provide a `readFile` function
instead:

```ts
summon.compile({
  path: "./path/to/main.ts",
  readFile: (filePath) => fs.readFileSync(filePath),
});
```

## Development

Build with `npm run build`. This will compile the wasm subproject and also
transpile typescript into javascript. [Rust toolchain](https://rustup.rs/)
required.

Test with `npm test`.

## Example Projects

- [MPC Hello](https://mpc.pse.dev/apps/hello)
- [2PC is for Lovers](https://mpc.pse.dev/apps/2pc-is-for-lovers/)
