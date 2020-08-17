import {
  ADD,
  ARCCOS,
  ARCTAN,
  cadr,
  car,
  cdr,
  COS,
  defs,
  iscons,
  isdouble,
  PI,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import {
  pop_integer,
  push_double,
  push_integer,
  push_rational,
} from './bignum';
import { Eval } from './eval';
import { isnegative, isnpi } from './is';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { sine } from './sin';
/* cos =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the cosine of x.

*/
export function Eval_cos(p1: U) {
  push(cadr(p1));
  Eval();
  cosine();
}

export function cosine() {
  let p1: U;
  p1 = pop();
  if (car(p1) === symbol(ADD)) {
    cosine_of_angle_sum(p1);
  } else {
    cosine_of_angle(p1);
  }
}

// Use angle sum formula for special angles.
function cosine_of_angle_sum(p1: U) {
  let p2: U, B: U, A: U;
  p2 = cdr(p1);
  while (iscons(p2)) {
    B = car(p2);
    if (isnpi(B)) {
      push(p1);
      push(B);
      subtract();
      A = pop();
      push(A);
      cosine();
      push(B);
      cosine();
      multiply();
      push(A);
      sine();
      push(B);
      sine();
      multiply();
      subtract();
      return;
    }
    p2 = cdr(p2);
  }
  cosine_of_angle(p1);
}

function cosine_of_angle(p1: U) {
  if (car(p1) === symbol(ARCCOS)) {
    push(cadr(p1));
    return;
  }

  if (isdouble(p1)) {
    let d = Math.cos(p1.d);
    if (Math.abs(d) < 1e-10) {
      d = 0.0;
    }
    push_double(d);
    return;
  }

  // cosine function is symmetric, cos(-x) = cos(x)

  if (isnegative(p1)) {
    push(p1);
    negate();
    p1 = pop();
  }

  // cos(arctan(x)) = 1 / sqrt(1 + x^2)

  // see p. 173 of the CRC Handbook of Mathematical Sciences

  if (car(p1) === symbol(ARCTAN)) {
    push_integer(1);
    push(cadr(p1));
    push_integer(2);
    power();
    add();
    push_rational(-1, 2);
    power();
    return;
  }

  // multiply by 180/pi to go from radians to degrees.
  // we go from radians to degrees because it's much
  // easier to calculate symbolic results of most (not all) "classic"
  // angles (e.g. 30,45,60...) if we calculate the degrees
  // and the we do a switch on that.
  // Alternatively, we could look at the fraction of pi
  // (e.g. 60 degrees is 1/3 pi) but that's more
  // convoluted as we'd need to look at both numerator and
  // denominator.

  push(p1);
  push_integer(180);
  multiply();

  if (defs.evaluatingAsFloats) {
    push_double(Math.PI);
  } else {
    push_symbol(PI);
  }

  divide();

  const n = pop_integer();

  // most "good" (i.e. compact) trigonometric results
  // happen for a round number of degrees. There are some exceptions
  // though, e.g. 22.5 degrees, which we don't capture here.
  if (n < 0 || isNaN(n)) {
    push(symbol(COS));
    push(p1);
    list(2);
    return;
  }

  switch (n % 360) {
    case 90:
    case 270:
      return push_integer(0);
    case 60:
    case 300:
      return push_rational(1, 2);
    case 120:
    case 240:
      return push_rational(-1, 2);
    case 45:
    case 315:
      push_rational(1, 2);
      push_integer(2);
      push_rational(1, 2);
      power();
      return multiply();
    case 135:
    case 225:
      push_rational(-1, 2);
      push_integer(2);
      push_rational(1, 2);
      power();
      return multiply();
    case 30:
    case 330:
      push_rational(1, 2);
      push_integer(3);
      push_rational(1, 2);
      power();
      return multiply();
    case 150:
    case 210:
      push_rational(-1, 2);
      push_integer(3);
      push_rational(1, 2);
      power();
      return multiply();
    case 0:
      return push_integer(1);
    case 180:
      return push_integer(-1);
    default:
      push(symbol(COS));
      push(p1);
      return list(2);
  }
}
