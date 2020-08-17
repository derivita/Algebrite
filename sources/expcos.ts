import { cadr, defs, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { exponential } from '../sources/misc';
import { add } from './add';
import { push_rational } from './bignum';
import { Eval } from './eval';
import { multiply, negate } from './multiply';
// Do the exponential cosine function.
export function Eval_expcos(p1: U) {
  push(cadr(p1));
  Eval();
  expcos();
}

export function expcos() {
  const p1 = pop();

  push(defs.imaginaryunit);
  push(p1);
  multiply();
  exponential();
  push_rational(1, 2);
  multiply();

  push(defs.imaginaryunit);
  negate();
  push(p1);
  multiply();
  exponential();
  push_rational(1, 2);
  multiply();

  add();
}
