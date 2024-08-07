import { expect } from 'chai';

import * as summon from '../src/index';
import blockTrim from './helpers/blockTrim';

describe('summon', () => {
  before(async () => {
    await summon.init();
  });

  it('compiles addition', () => {
    const circuit = summon.compile('/src/main.ts', {
      '/src/main.ts': `
        export default function main(a: number, b: number) {
          return a + b;
        }
      `
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
});
