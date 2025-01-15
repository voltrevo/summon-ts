// This obviously doesn't need to be a separate file, but it's here to
// demonstrate that you can split up your summon code like this.
import isLarger from './isLarger.ts';

export default function main(a: number, b: number) {
  return isLarger(a, b) ? a : b;
}
