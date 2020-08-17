import { defs } from '../runtime/defs';
import { stop } from '../runtime/run';
import { push } from '../runtime/stack';
import { add } from './add';
import { pop_double, push_double } from './bignum';
import { multiply } from './multiply';
// power function for double precision floating point
export function dpow() {
  let a = 0.0;
  let b = 0.0;

  const expo = pop_double();
  const base = pop_double();

  // divide by zero?
  if (base === 0.0 && expo < 0.0) {
    stop('divide by zero');
  }

  // nonnegative base or integer power?
  if (base >= 0.0 || expo % 1.0 === 0.0) {
    const result = Math.pow(base, expo);
    push_double(result);
    return;
  }

  const result = Math.pow(Math.abs(base), expo);

  const theta = Math.PI * expo;

  // this ensures the real part is 0.0 instead of a tiny fraction
  if (expo % 0.5 === 0.0) {
    a = 0.0;
    b = Math.sin(theta);
  } else {
    a = Math.cos(theta);
    b = Math.sin(theta);
  }

  push_double(a * result);
  push_double(b * result);
  push(defs.imaginaryunit);
  multiply();
  add();
}
