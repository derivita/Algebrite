import {
  ARCCOS,
  cadr,
  car,
  cdr,
  COS,
  defs,
  isdouble,
  isrational,
  MULTIPLY,
  PI,
  POWER,
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
/* arccos =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse cosine of x.

*/
export function Eval_arccos(x: U) {
  push(cadr(x));
  Eval();
  arccos();
}

function arccos() {
  const x: U = pop();

  if (car(x) === symbol(COS)) {
    push(cadr(x));
    return;
  }

  if (isdouble(x)) {
    const errno = 0;
    const d = Math.acos(x.d);
    if (errno) {
      stop('arccos function argument is not in the interval [-1,1]');
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
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI / 4.0);
    } else {
      push_rational(1, 4);
      push_symbol(PI);
      multiply();
    }
    return;
  }

  // if x == -1/sqrt(2) then return 3/4*pi (135 degrees)
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
      push_double((Math.PI * 3.0) / 4.0);
    } else {
      push_rational(3, 4);
      push_symbol(PI);
      multiply();
    }
    return;
  }

  // if x == sqrt(3)/2 then return 1/6*pi (30 degrees)
  if (isSqrtThreeOverTwo(x)) {
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI / 6.0);
    } else {
      push_rational(1, 6);
      push_symbol(PI);
      multiply();
    }
    return;
  }

  // if x == -sqrt(3)/2 then return 5/6*pi (150 degrees)
  if (isMinusSqrtThreeOverTwo(x)) {
    if (defs.evaluatingAsFloats) {
      push_double((5.0 * Math.PI) / 6.0);
    } else {
      push_rational(5, 6);
      push_symbol(PI);
      multiply();
    }
    return;
  }

  if (!isrational(x)) {
    push_symbol(ARCCOS);
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
        push_double(Math.PI);
      } else {
        push_symbol(PI);
      }
      break;

    case -1:
      if (defs.evaluatingAsFloats) {
        push_double((Math.PI * 2.0) / 3.0);
      } else {
        push_rational(2, 3);
        push_symbol(PI);
        multiply();
      }
      break;

    case 0:
      if (defs.evaluatingAsFloats) {
        push_double(Math.PI / 2.0);
      } else {
        push_rational(1, 2);
        push_symbol(PI);
        multiply();
      }
      break;

    case 1:
      if (defs.evaluatingAsFloats) {
        push_double(Math.PI / 3.0);
      } else {
        push_rational(1, 3);
        push_symbol(PI);
        multiply();
      }
      break;

    case 2:
      if (defs.evaluatingAsFloats) {
        push_double(0.0);
      } else {
        push(defs.zero);
      }
      break;

    default:
      push_symbol(ARCCOS);
      push(x);
      list(2);
  }
}
