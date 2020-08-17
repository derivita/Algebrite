import {
  ADD,
  cadr,
  car,
  cdr,
  defs,
  GAMMA,
  isrational,
  MEQUAL,
  Num,
  PI,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add } from './add';
import { push_double, push_integer, push_rational } from './bignum';
import { Eval } from './eval';
import { isnegativeterm } from './is';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { sine } from './sin';
//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  Gamma function gamma(x)
//
//-----------------------------------------------------------------------------
export function Eval_gamma(p1: U) {
  push(cadr(p1));
  Eval();
  gamma();
}

function gamma() {
  gammaf();
}

function gammaf() {
  //  double d

  const p1 = pop();

  if (isrational(p1) && MEQUAL(p1.q.a, 1) && MEQUAL(p1.q.b, 2)) {
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push_symbol(PI);
    }
    push_rational(1, 2);
    power();
    return;
  }

  if (isrational(p1) && MEQUAL(p1.q.a, 3) && MEQUAL(p1.q.b, 2)) {
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push_symbol(PI);
    }
    push_rational(1, 2);
    power();
    push_rational(1, 2);
    multiply();
    return;
  }

  //  if (p1->k == DOUBLE) {
  //    d = exp(lgamma(p1.d))
  //    push_double(d)
  //    return
  //  }

  if (isnegativeterm(p1)) {
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push_symbol(PI);
    }
    push_integer(-1);
    multiply();
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push_symbol(PI);
    }
    push(p1);
    multiply();
    sine();
    push(p1);
    multiply();
    push(p1);
    negate();
    gamma();
    multiply();
    divide();
    return;
  }

  if (car(p1) === symbol(ADD)) {
    gamma_of_sum(p1);
    return;
  }

  push_symbol(GAMMA);
  push(p1);
  list(2);
}

function gamma_of_sum(p1: U) {
  const p3 = cdr(p1);
  if (
    isrational(car(p3)) &&
    MEQUAL((car(p3) as Num).q.a, 1) &&
    MEQUAL((car(p3) as Num).q.b, 1)
  ) {
    push(cadr(p3));
    push(cadr(p3));
    gamma();
    multiply();
  } else if (
    isrational(car(p3)) &&
    MEQUAL((car(p3) as Num).q.a, -1) &&
    MEQUAL((car(p3) as Num).q.b, 1)
  ) {
    push(cadr(p3));
    gamma();
    push(cadr(p3));
    push_integer(-1);
    add();
    divide();
  } else {
    push_symbol(GAMMA);
    push(p1);
    list(2);
  }
}
