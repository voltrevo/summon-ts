/* eslint-disable camelcase */

import { expect } from 'chai';
import { readFileSync } from 'fs';

import * as summon from '../src/index';
import blockTrim from './helpers/blockTrim';

describe('summon', () => {
  before(async () => {
    await summon.init();
  });

  it('compiles a circuit from the file system', () => {
    const circuit = summon.compile('./circuit/main.ts', filePath =>
      readFileSync(filePath, 'utf8'),
    );

    const expectedCircuit = summon.compile('/src/main.ts', {
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

  it('compiles addition', () => {
    const circuit = summon.compile('/src/main.ts', {
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

  // FIXME: on linux / gh actions:
  //   "input_name_to_wire_index": {
  // -      "a": 8
  // -      "b": 0
  // +      "a": 0
  // +      "b": 8
  //   }
  // https://github.com/voltrevo/summon-ts/actions/runs/12627100358/job/35181187804?pr=2#step:10:35
  it('compiles xor', () => {
    const circuit = summon.compileBoolean('/src/main.ts', 8, {
      '/src/main.ts': `
          export default function main(a: number, b: number) {
            return (a ^ b) & 1;
          }
        `,
    });

    expect(circuit).to.deep.equal({
      bristol: blockTrim(`
        8 24
        2 8 8
        1 8

        2 1 7 15 23 XOR
        2 1 0 0 16 XOR
        1 1 16 22 COPY
        1 1 16 21 COPY
        1 1 16 20 COPY
        1 1 16 19 COPY
        1 1 16 18 COPY
        1 1 16 17 COPY
      `),
      info: {
        input_name_to_wire_index: {
          a: 0,
          b: 8,
        },
        constants: {},
        output_name_to_wire_index: {
          main: 16,
        },
      },
    });
  });
});
