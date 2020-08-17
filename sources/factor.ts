import {
  caddr,
  cadr,
  car,
  cdddr,
  cdr,
  defs,
  iscons,
  MAXPRIMETAB,
  MULTIPLY,
  NIL,
  primetab,
  symbol,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { pop_integer, push_integer } from './bignum';
import { Eval } from './eval';
import { factorpoly } from './factorpoly';
import { guess } from './guess';
import { isinteger } from './is';
import { multiply_all_noexpand } from './multiply';
import { factor_number } from './pollard';
// factor a polynomial or integer
export function Eval_factor(p1: U) {
  push(cadr(p1));
  Eval();

  push(caddr(p1));
  Eval();

  const p2 = pop();
  if (p2 === symbol(NIL)) {
    guess();
  } else {
    push(p2);
  }

  factor();

  // more factoring?
  p1 = cdddr(p1);

  while (iscons(p1)) {
    push(car(p1));
    Eval();
    factor_again();
    p1 = cdr(p1);
  }
}

function factor_again() {
  const p2 = pop();
  let p1 = pop();

  const h = defs.tos;

  if (car(p1) === symbol(MULTIPLY)) {
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      push(p2);
      factor_term();
      p1 = cdr(p1);
    }
  } else {
    push(p1);
    push(p2);
    factor_term();
  }

  const n = defs.tos - h;
  if (n > 1) {
    multiply_all_noexpand(n);
  }
}

function factor_term() {
  factorpoly();
  let p1 = pop();
  if (car(p1) === symbol(MULTIPLY)) {
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      p1 = cdr(p1);
    }
  } else {
    push(p1);
  }
}

export function factor() {
  const p2 = pop();
  const p1 = pop();
  if (isinteger(p1)) {
    push(p1);
    factor_number(); // see pollard.cpp
  } else {
    push(p1);
    push(p2);
    factorpoly();
  }
}

// for factoring small integers (2^32 or less)
export function factor_small_number() {
  let n = pop_integer();

  if (isNaN(n)) {
    stop('number too big to factor');
  }

  if (n < 0) {
    n = -n;
  }

  for (let i = 0; i < MAXPRIMETAB; i++) {
    const d = primetab[i];

    if (d > n / d) {
      break;
    }

    let expo = 0;

    while (n % d === 0) {
      n /= d;
      expo++;
    }

    if (expo) {
      push_integer(d);
      push_integer(expo);
    }
  }

  if (n > 1) {
    push_integer(n);
    push_integer(1);
  }
}
