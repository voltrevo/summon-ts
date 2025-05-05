import './summon.d.ts';

// This obviously doesn't need to be a separate file, but it's here to
// demonstrate that you can split up your summon code like this.
import isLarger from './isLarger.ts';

export default (io: Summon.IO) => {
  const a = io.input('alice', 'a', summon.number());
  const b = io.input('bob', 'b', summon.number());

  io.outputPublic('res', isLarger(a, b));
};
