import {
  cadddr,
  caddr,
  cadr,
  defs,
  NIL,
  symbol,
  SYMBOL_X,
  U,
} from '../runtime/defs';
import { moveTos, pop, push } from '../runtime/stack';
import { add, subtract } from './add';
import { push_integer } from './bignum';
import { coeff } from './coeff';
import { Eval } from './eval';
import { divide, multiply } from './multiply';
import { power } from './power';
// Divide polynomials
export function Eval_quotient(p1: U) {
  push(cadr(p1)); // 1st arg, p(x)
  Eval();

  push(caddr(p1)); // 2nd arg, q(x)
  Eval();

  push(cadddr(p1)); // 3rd arg, x
  Eval();

  p1 = pop(); // default x
  if (p1 === symbol(NIL)) {
    p1 = symbol(SYMBOL_X);
  }
  push(p1);

  divpoly();
}

//-----------------------------------------------------------------------------
//
//  Divide polynomials
//
//  Input:    tos-3    Dividend
//
//      tos-2    Divisor
//
//      tos-1    x
//
//  Output:    tos-1    Quotient
//
//-----------------------------------------------------------------------------
export function divpoly() {
  const X = pop();
  const DIVISOR = pop();
  const DIVIDEND = pop();

  const h = defs.tos;

  const dividend = defs.tos;

  push(DIVIDEND);
  push(X);
  let m = coeff() - 1; // m is dividend's power

  const divisor = defs.tos;

  push(DIVISOR);
  push(X);
  const n = coeff() - 1; // n is divisor's power

  let x = m - n;

  push_integer(0);
  let QUOTIENT = pop();

  while (x >= 0) {
    push(defs.stack[dividend + m]);
    push(defs.stack[divisor + n]);
    divide();
    const Q = pop();

    for (let i = 0; i <= n; i++) {
      push(defs.stack[dividend + x + i]);
      push(defs.stack[divisor + i]);
      push(Q);
      multiply();
      subtract();
      defs.stack[dividend + x + i] = pop();
    }

    push(QUOTIENT);
    push(Q);
    push(X);
    push_integer(x);
    power();
    multiply();
    add();
    QUOTIENT = pop();

    m--;
    x--;
  }

  moveTos(h);

  push(QUOTIENT);
}
