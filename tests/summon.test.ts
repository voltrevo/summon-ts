import { expect } from 'chai';

import * as summon from '../src/index';

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
      bristol: '',
      info: {},
    });
  });
});
