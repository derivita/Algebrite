import { defs, MZERO, Num } from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { makeSignSameAs } from './bignum';
import { mgcd } from './mgcd';
import { mdiv, mmul } from './mmul';

//  Divide rational numbers
//
//  Input:    tos-2    dividend
//
//      tos-1    divisor
//
//  Output:    quotient on stack
export function qdiv() {
  const p2 = pop() as Num;
  let p1 = pop() as Num;

  // zero?
  if (MZERO(p2.q.a)) {
    stop('divide by zero');
  }

  if (MZERO(p1.q.a)) {
    push(defs.zero);
    return;
  }

  const aa = mmul(p1.q.a, p2.q.b);
  const bb = mmul(p1.q.b, p2.q.a);

  let c = mgcd(aa, bb);

  c = makeSignSameAs(c, bb);

  p1 = new Num(mdiv(aa, c), mdiv(bb, c));

  push(p1);
}
