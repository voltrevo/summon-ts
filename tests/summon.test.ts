/* eslint-disable camelcase */

import { expect } from 'chai';
import { readFileSync } from 'fs';

import * as summon from '../src/index';
import blockTrim from './helpers/blockTrim';
import CompileError from '../src/compileError';

describe('summon', () => {
  before(async () => {
    await summon.init();
  });

  it('compiles a circuit from the file system', () => {
    const { circuit, diagnostics } = summon.compile(
      './circuit/main.ts',
      filePath => readFileSync(filePath, 'utf8'),
    );

    const { circuit: expectedCircuit } = summon.compile('/src/main.ts', {
      '/src/main.ts': `
        import isLarger from './isLarger.ts';

        export default function main(a: number, b: number) {
          return isLarger(a, b) ? a : b;
        }
      `,
      '/src/isLarger.ts': `
        export default function isLarger(a: number, b: number): boolean {
          return a > b;
        }
      `,
    });

    expect(circuit).to.be.deep.equal(expectedCircuit);
  });

  it('emits compilation errors ', () => {
    const fun = () =>
      summon.compile('/src/main.ts', {
        '/src/main.ts': `
        export default function main(a: number, b: number) {
          const c = 0;

          c = b;

          return a + c;
        }
      `,
      });

    expect(fun)
      .to.throw(CompileError)
      .and.satisfy(({ message, circuit, diagnostics }: CompileError) => {
        expect(message).to.equal('Cannot mutate const c');

        expect(circuit).to.have.property('bristol');

        expect(diagnostics['/src/main.ts']).to.have.length(1);
        expect(diagnostics['/src/main.ts'][0].level).to.be.equal('Error');

        return true;
      });
  });

  it('non-error diagnostic is provided without throwing', () => {
    const fun = () =>
      summon.compile('/src/main.ts', {
        '/src/main.ts': `
        export default function main(a: number, b: number) {
          let c = 0; // lint: c is implicitly const due to capture
          const f = () => c;

          return a + c;
        }
      `,
      });

    const { circuit, diagnostics } = fun();

    expect(diagnostics['/src/main.ts']).to.have.length(1);
    expect(diagnostics['/src/main.ts'][0].level).to.be.equal('Lint');

    expect(circuit).to.have.property('bristol');
  });

  it('compiles addition', () => {
    const { circuit } = summon.compile('/src/main.ts', {
      '/src/main.ts': `
        export default function main(a: number, b: number) {
          return a + b;
        }
      `,
    });

    expect(circuit).to.deep.equal({
      bristol: blockTrim(`
        1 3
        2 1 1
        1 1

        2 1 0 1 2 AAdd
      `),
      info: {
        input_name_to_wire_index: {
          a: 0,
          b: 1,
        },
        constants: {},
        output_name_to_wire_index: {
          main: 2,
        },
      },
    });
  });

  it('compiles xor', () => {
    const { circuit } = summon.compileBoolean('/src/main.ts', 8, {
      '/src/main.ts': `
          export default function main(a: number, b: number) {
            return (a ^ b) & 1;
          }
        `,
    });

    expect(circuit).to.deep.equal({
      bristol: blockTrim(`
        10 26
        2 8 8
        1 8

        2 1 0 8 18 XOR
        2 1 0 0 16 XOR
        1 1 16 17 INV
        1 1 17 19 INV
        1 1 17 20 INV
        1 1 17 21 INV
        1 1 17 22 INV
        1 1 17 23 INV
        1 1 17 24 INV
        1 1 17 25 INV
      `),
      info: {
        input_name_to_wire_index: {
          a: 0,
          b: 8,
        },
        constants: {},
        output_name_to_wire_index: {
          main: 18,
        },
      },
    });
  });
});
