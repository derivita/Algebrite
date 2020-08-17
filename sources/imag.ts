import { cadr, defs, U } from '../runtime/defs';
import { pop, push, top } from '../runtime/stack';
import { subtract } from './add';
import { push_integer } from './bignum';
import { conjugate } from './conj';
import { Eval } from './eval';
import { divide } from './multiply';
import { rect } from './rect';
/*
 Returns the coefficient of the imaginary part of complex z

  z    imag(z)
  -    -------

  a + i b    b

  exp(i a)  sin(a)
*/
const DEBUG_IMAG = false;

export function Eval_imag(p1: U) {
  push(cadr(p1));
  Eval();
  imag();
}

export function imag() {
  rect();
  const p1 = pop();

  if (DEBUG_IMAG) {
    console.log('IMAGE of ' + p1);
  }

  push(p1);
  push(p1);
  conjugate();
  if (DEBUG_IMAG) {
    console.log(' image: conjugate result: ' + top());
  }

  subtract();
  push_integer(2);
  divide();
  if (DEBUG_IMAG) {
    console.log(' image: 1st divide result: ' + top());
  }
  push(defs.imaginaryunit);
  divide();
  if (DEBUG_IMAG) {
    console.log(' image: 2nd divide result: ' + top());
  }
}
