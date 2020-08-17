import { cadr, defs, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { exponential } from '../sources/misc';
import { subtract } from './add';
import { push_rational } from './bignum';
import { Eval } from './eval';
import { divide, multiply, negate } from './multiply';
// Do the exponential sine function.
export function Eval_expsin(p1: U) {
  push(cadr(p1));
  Eval();
  expsin();
}

export function expsin() {
  const p1 = pop();

  push(defs.imaginaryunit);
  push(p1);
  multiply();
  exponential();
  push(defs.imaginaryunit);
  divide();
  push_rational(1, 2);
  multiply();

  push(defs.imaginaryunit);
  negate();
  push(p1);
  multiply();
  exponential();
  push(defs.imaginaryunit);
  divide();
  push_rational(1, 2);
  multiply();

  subtract();
}
