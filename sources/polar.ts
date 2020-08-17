import { cadr, defs, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { exponential } from '../sources/misc';
import { abs } from './abs';
import { arg } from './arg';
import { Eval } from './eval';
import { multiply } from './multiply';
/*
Convert complex z to polar form

  Input:    push  z

  Output:    Result on stack

  polar(z) = abs(z) * exp(i * arg(z))
*/
export function Eval_polar(p1: U) {
  push(cadr(p1));
  Eval();
  polar();
}

export function polar() {
  // there are points where we turn polar
  // representations into rect, we set a "stack flag"
  // here to avoid that, so we don't undo the
  // work that we are trying to do.
  defs.evaluatingPolar++;
  const p1 = pop();
  push(p1);
  abs();
  push(defs.imaginaryunit);
  push(p1);
  arg();
  multiply();
  exponential();
  multiply();
  defs.evaluatingPolar--;
}
