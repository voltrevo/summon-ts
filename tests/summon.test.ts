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
    const { circuit } = summon.compile({
      path: './circuit/main.ts',
      readFile: filePath => readFileSync(filePath, 'utf8'),
    });

    const { circuit: expectedCircuit } = summon.compile({
      path: '/src/main.ts',
      files: {
        '/src/main.ts': `
          import isLarger from './isLarger.ts';

          export default (io: Summon.IO) => {
            const a = io.input('alice', 'a', summon.number());
            const b = io.input('bob', 'b', summon.number());

            io.outputPublic('res', isLarger(a, b));
          };
        `,
        '/src/isLarger.ts': `
          export default function isLarger(a: number, b: number): boolean {
            return a > b;
          }
        `,
      },
    });

    expect(circuit).to.be.deep.equal(expectedCircuit);
  });

  it('emits compilation errors ', () => {
    const fun = () =>
      summon.compile({
        path: '/src/main.ts',
        files: {
          '/src/main.ts': `
            export default (io: Summon.IO) => {
              const a = io.input('alice', 'a', summon.number());
              const b = io.input('bob', 'b', summon.number());

              const c = 0;

              c = b;

              io.outputPublic('res', a + c);
            };
          `,
        },
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
      summon.compile({
        path: '/src/main.ts',
        files: {
          '/src/main.ts': `
            export default (io: Summon.IO) => {
              const a = io.input('alice', 'a', summon.number());
              const b = io.input('bob', 'b', summon.number());

              let c = 0; // lint: c is implicitly const due to capture
              const f = () => c;

              io.outputPublic('res', a + c);
            };
          `,
        },
      });

    const { circuit, diagnostics } = fun();

    expect(diagnostics['/src/main.ts']).to.have.length(1);
    expect(diagnostics['/src/main.ts'][0].level).to.be.equal('Lint');

    expect(circuit).to.have.property('bristol');
  });

  it('compiles addition', () => {
    const { circuit } = summon.compile({
      path: '/src/main.ts',
      files: {
        '/src/main.ts': `
          export default (io: Summon.IO) => {
            const a = io.input('alice', 'a', summon.number());
            const b = io.input('bob', 'b', summon.number());

            io.outputPublic('main', a + b);
          }
        `,
      },
    });

    expect(circuit).to.deep.equal({
      bristol: blockTrim(`
        1 3
        2 1 1
        1 1

        2 1 0 1 2 AAdd
      `),
      info: {
        constants: [],
        inputs: [
          { name: 'a', type: 'number', address: 0, width: 1 },
          { name: 'b', type: 'number', address: 1, width: 1 },
        ],
        outputs: [{ name: 'main', type: 'number', address: 2, width: 1 }],
      },
      mpcSettings: [
        { name: 'alice', inputs: ['a'], outputs: ['main'] },
        { name: 'bob', inputs: ['b'], outputs: ['main'] },
      ],
    });
  });

  it('compiles xor', () => {
    const { circuit } = summon.compile({
      path: '/src/main.ts',
      boolifyWidth: 8,
      files: {
        '/src/main.ts': `
          export default (io: Summon.IO) => {
            const a = io.input('alice', 'a', summon.number());
            const b = io.input('bob', 'b', summon.number());

            io.outputPublic('main', (a ^ b) & 1);
          }
        `,
      },
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
        constants: [],
        inputs: [
          { name: 'a', type: 'number', address: 0, width: 8 },
          { name: 'b', type: 'number', address: 8, width: 8 },
        ],
        outputs: [{ name: 'main', type: 'number', address: 18, width: 8 }],
      },
      mpcSettings: [
        { name: 'alice', inputs: ['a'], outputs: ['main'] },
        { name: 'bob', inputs: ['b'], outputs: ['main'] },
      ],
    });
  });
});
