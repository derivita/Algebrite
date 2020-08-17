import { defs, MZERO, Num } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { makeSignSameAs } from './bignum';
import { mgcd } from './mgcd';
import { mdiv, mmul } from './mmul';
//  Multiply rational numbers
//
//  Input:    tos-2    multiplicand
//
//      tos-1    multiplier
//
//  Output:    product on stack
export function qmul() {
  const p2 = pop() as Num;
  let p1 = pop() as Num;

  // zero?
  if (MZERO(p1.q.a) || MZERO(p2.q.a)) {
    push(defs.zero);
    return;
  }

  const aa = mmul(p1.q.a, p2.q.a);
  const bb = mmul(p1.q.b, p2.q.b);

  let c = mgcd(aa, bb);

  c = makeSignSameAs(c, bb);

  p1 = new Num(mdiv(aa, c), mdiv(bb, c));

  //mfree(aa)
  //mfree(bb)

  push(p1);
}
