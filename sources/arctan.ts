import {
  ARCTAN,
  caddr,
  cadr,
  car,
  cdr,
  COS,
  defs,
  isdouble,
  MULTIPLY,
  PI,
  POWER,
  SIN,
  symbol,
  TAN,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { equal } from '../sources/misc';
import { push_double, push_rational } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { equaln, equalq, isnegative, isZeroAtomOrTensor } from './is';
import { list } from './list';
import { multiply, negate } from './multiply';
import { numerator } from './numerator';
/* arctan =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse tangent of x.

*/
export function Eval_arctan(x: U) {
  push(cadr(x));
  Eval();
  arctan();
}

export function arctan() {
  let p2: U, p3: U;
  let d = 0;

  let x = pop();

  if (car(x) === symbol(TAN)) {
    push(cadr(x));
    return;
  }

  if (isdouble(x)) {
    const errno = 0;
    d = Math.atan(x.d);
    if (errno) {
      stop('arctan function error');
    }
    push_double(d);
    return;
  }

  if (isZeroAtomOrTensor(x)) {
    push(defs.zero);
    return;
  }

  if (isnegative(x)) {
    push(x);
    negate();
    arctan();
    negate();
    return;
  }

  // arctan(sin(a) / cos(a)) ?
  if (Find(x, symbol(SIN)) && Find(x, symbol(COS))) {
    push(x);
    numerator();
    p2 = pop();
    push(x);
    denominator();
    p3 = pop();
    if (
      car(p2) === symbol(SIN) &&
      car(p3) === symbol(COS) &&
      equal(cadr(p2), cadr(p3))
    ) {
      push(cadr(p2));
      return;
    }
  }

  // arctan(1/sqrt(3)) -> pi/6
  // second if catches the other way of saying it, sqrt(3)/3
  if (
    (car(x) === symbol(POWER) &&
      equaln(cadr(x), 3) &&
      equalq(caddr(x), -1, 2)) ||
    (car(x) === symbol(MULTIPLY) &&
      equalq(car(cdr(x)), 1, 3) &&
      car(car(cdr(cdr(x)))) === symbol(POWER) &&
      equaln(car(cdr(car(cdr(cdr(x))))), 3) &&
      equalq(car(cdr(cdr(car(cdr(cdr(x)))))), 1, 2))
  ) {
    push_rational(1, 6);
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push(symbol(PI));
    }
    multiply();
    return;
  }

  // arctan(1) -> pi/4
  if (equaln(x, 1)) {
    push_rational(1, 4);
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push(symbol(PI));
    }
    multiply();
    return;
  }

  // arctan(sqrt(3)) -> pi/3
  if (
    car(x) === symbol(POWER) &&
    equaln(cadr(x), 3) &&
    equalq(caddr(x), 1, 2)
  ) {
    push_rational(1, 3);
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push(symbol(PI));
    }
    multiply();
    return;
  }

  push_symbol(ARCTAN);
  push(x);
  list(2);
}
