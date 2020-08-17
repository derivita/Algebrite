import {
  ARCSIN,
  cadr,
  car,
  cdr,
  defs,
  isdouble,
  isrational,
  MULTIPLY,
  PI,
  POWER,
  SIN,
  symbol,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import {
  pop_integer,
  push_double,
  push_integer,
  push_rational,
} from './bignum';
import { Eval } from './eval';
import {
  equaln,
  equalq,
  isminusoneoversqrttwo,
  isMinusSqrtThreeOverTwo,
  isoneoversqrttwo,
  isSqrtThreeOverTwo,
} from './is';
import { list } from './list';
import { multiply } from './multiply';
/* arcsin =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse sine of x.

*/
export function Eval_arcsin(x: U) {
  push(cadr(x));
  Eval();
  arcsin();
}

function arcsin() {
  const x: U = pop();

  if (car(x) === symbol(SIN)) {
    push(cadr(x));
    return;
  }

  if (isdouble(x)) {
    const errno = 0;
    const d = Math.asin(x.d);
    if (errno) {
      stop('arcsin function argument is not in the interval [-1,1]');
    }
    push_double(d);
    return;
  }

  // if x == 1/sqrt(2) then return 1/4*pi (45 degrees)
  // second if catches the other way of saying it, sqrt(2)/2
  if (
    isoneoversqrttwo(x) ||
    (car(x) === symbol(MULTIPLY) &&
      equalq(car(cdr(x)), 1, 2) &&
      car(car(cdr(cdr(x)))) === symbol(POWER) &&
      equaln(car(cdr(car(cdr(cdr(x))))), 2) &&
      equalq(car(cdr(cdr(car(cdr(cdr(x)))))), 1, 2))
  ) {
    push_rational(1, 4);
    push_symbol(PI);
    multiply();
    return;
  }

  // if x == -1/sqrt(2) then return -1/4*pi (-45 degrees)
  // second if catches the other way of saying it, -sqrt(2)/2
  if (
    isminusoneoversqrttwo(x) ||
    (car(x) === symbol(MULTIPLY) &&
      equalq(car(cdr(x)), -1, 2) &&
      car(car(cdr(cdr(x)))) === symbol(POWER) &&
      equaln(car(cdr(car(cdr(cdr(x))))), 2) &&
      equalq(car(cdr(cdr(car(cdr(cdr(x)))))), 1, 2))
  ) {
    if (defs.evaluatingAsFloats) {
      push_double(-Math.PI / 4.0);
    } else {
      push_rational(-1, 4);
      push_symbol(PI);
      multiply();
    }
    return;
  }

  // if x == sqrt(3)/2 then return 1/3*pi (60 degrees)
  if (isSqrtThreeOverTwo(x)) {
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI / 3.0);
    } else {
      push_rational(1, 3);
      push_symbol(PI);
      multiply();
    }
    return;
  }

  // if x == -sqrt(3)/2 then return -1/3*pi (-60 degrees)
  if (isMinusSqrtThreeOverTwo(x)) {
    if (defs.evaluatingAsFloats) {
      push_double(-Math.PI / 3.0);
    } else {
      push_rational(-1, 3);
      push_symbol(PI);
      multiply();
    }
    return;
  }

  if (!isrational(x)) {
    push_symbol(ARCSIN);
    push(x);
    list(2);
    return;
  }

  push(x);
  push_integer(2);
  multiply();
  const n = pop_integer();

  switch (n) {
    case -2:
      if (defs.evaluatingAsFloats) {
        push_double(-Math.PI / 2.0);
      } else {
        push_rational(-1, 2);
        push_symbol(PI);
        multiply();
      }
      break;

    case -1:
      if (defs.evaluatingAsFloats) {
        push_double(-Math.PI / 6.0);
      } else {
        push_rational(-1, 6);
        push_symbol(PI);
        multiply();
      }
      break;

    case 0:
      if (defs.evaluatingAsFloats) {
        push_double(0.0);
      } else {
        push(defs.zero);
      }
      break;

    case 1:
      if (defs.evaluatingAsFloats) {
        push_double(Math.PI / 6.0);
      } else {
        push_rational(1, 6);
        push_symbol(PI);
        multiply();
      }
      break;

    case 2:
      if (defs.evaluatingAsFloats) {
        push_double(Math.PI / 2.0);
      } else {
        push_rational(1, 2);
        push_symbol(PI);
        multiply();
      }
      break;

    default:
      push_symbol(ARCSIN);
      push(x);
      list(2);
  }
}
