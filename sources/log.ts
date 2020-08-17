import {
  caddr,
  cadr,
  car,
  cdr,
  defs,
  E,
  iscons,
  isdouble,
  LOG,
  MULTIPLY,
  PI,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { push_double, push_integer } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { equaln, isfraction, isnegativenumber } from './is';
import { list } from './list';
import { multiply, negate } from './multiply';
import { numerator } from './numerator';
// Natural logarithm.
//
// Note that we use the mathematics / Javascript / Mathematica
// convention that "log" is indeed the natural logarithm.
//
// In engineering, biology, astronomy, "log" can stand instead
// for the "common" logarithm i.e. base 10. Also note that Google
// calculations use log for the common logarithm.
export function Eval_log(p1: U) {
  push(cadr(p1));
  Eval();
  logarithm();
}

export function logarithm() {
  yylog();
}

function yylog() {
  let p1 = pop();

  if (p1 === symbol(E)) {
    push_integer(1);
    return;
  }

  if (equaln(p1, 1)) {
    push_integer(0);
    return;
  }

  if (isnegativenumber(p1)) {
    push(p1);
    negate();
    logarithm();
    push(defs.imaginaryunit);
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push_symbol(PI);
    }
    multiply();
    add();
    return;
  }

  if (isdouble(p1)) {
    const d = Math.log(p1.d);
    push_double(d);
    return;
  }

  // rational number and not an integer?
  if (isfraction(p1)) {
    push(p1);
    numerator();
    logarithm();
    push(p1);
    denominator();
    logarithm();
    subtract();
    return;
  }

  // log(a ^ b) --> b log(a)
  if (car(p1) === symbol(POWER)) {
    push(caddr(p1));
    push(cadr(p1));
    logarithm();
    multiply();
    return;
  }

  // log(a * b) --> log(a) + log(b)
  if (car(p1) === symbol(MULTIPLY)) {
    push_integer(0);
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      logarithm();
      add();
      p1 = cdr(p1);
    }
    return;
  }

  push_symbol(LOG);
  push(p1);
  list(2);
}
