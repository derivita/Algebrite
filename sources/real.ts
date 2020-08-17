import { cadr, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { add } from './add';
import { push_integer } from './bignum';
import { conjugate } from './conj';
import { Eval } from './eval';
import { divide } from './multiply';
import { rect } from './rect';
/*
 Returns the real part of complex z

  z    real(z)
  -    -------

  a + i b    a

  exp(i a)  cos(a)
*/
export function Eval_real(p1: U) {
  push(cadr(p1));
  Eval();
  real();
}

export function real() {
  rect();
  const p1 = pop();
  push(p1);
  push(p1);
  conjugate();
  add();
  push_integer(2);
  divide();
}
