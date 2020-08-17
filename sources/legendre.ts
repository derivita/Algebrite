import {
  cadddr,
  caddr,
  cadr,
  car,
  COS,
  issymbol,
  LEGENDRE,
  NIL,
  SECRETX,
  SIN,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { square } from '../sources/misc';
import { subtract } from './add';
import { pop_integer, push_integer, push_rational } from './bignum';
import { cosine } from './cos';
import { derivative } from './derivative';
import { Eval } from './eval';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { sine } from './sin';
import { subst } from './subst';
/*
 Legendre function

Example

  legendre(x,3,0)

Result

   5   3    3
  --- x  - --- x
   2        2

The computation uses the following recurrence relation.

  P(x,0) = 1

  P(x,1) = x

  n*P(x,n) = (2*(n-1)+1)*x*P(x,n-1) - (n-1)*P(x,n-2)

In the "for" loop we have i = n-1 so the recurrence relation becomes

  (i+1)*P(x,n) = (2*i+1)*x*P(x,n-1) - i*P(x,n-2)

For m > 0

  P(x,n,m) = (-1)^m * (1-x^2)^(m/2) * d^m/dx^m P(x,n)
*/
export function Eval_legendre(p1: U) {
  let p2: U;
  // 1st arg
  push(cadr(p1));
  Eval();

  // 2nd arg
  push(caddr(p1));
  Eval();

  // 3rd arg (optional)
  push(cadddr(p1));
  Eval();

  p2 = pop();
  if (p2 === symbol(NIL)) {
    push_integer(0);
  } else {
    push(p2);
  }

  legendre();
}

function legendre() {
  __legendre();
}

function __legendre() {
  let m = 0;
  let n = 0;

  const M = pop();
  const N = pop();
  let X = pop();

  push(N);
  n = pop_integer();

  push(M);
  m = pop_integer();

  if (n < 0 || isNaN(n) || m < 0 || isNaN(m)) {
    push_symbol(LEGENDRE);
    push(X);
    push(N);
    push(M);
    list(4);
    return;
  }

  if (issymbol(X)) {
    __legendre2(n, m, X);
  } else {
    const Y = X; // do this when X is an expr
    X = symbol(SECRETX);
    __legendre2(n, m, X);
    X = Y;
    push(symbol(SECRETX));
    push(X);
    subst();
    Eval();
  }

  __legendre3(m, X);
}

function __legendre2(n: number, m: number, X: U) {
  push_integer(1);
  push_integer(0);

  let Y1: U = pop();

  //  i=1  Y0 = 0
  //    Y1 = 1
  //    ((2*i+1)*x*Y1 - i*Y0) / i = x
  //
  //  i=2  Y0 = 1
  //    Y1 = x
  //    ((2*i+1)*x*Y1 - i*Y0) / i = -1/2 + 3/2*x^2
  //
  //  i=3  Y0 = x
  //    Y1 = -1/2 + 3/2*x^2
  //    ((2*i+1)*x*Y1 - i*Y0) / i = -3/2*x + 5/2*x^3

  for (let i = 0; i < n; i++) {
    const Y0 = Y1;
    Y1 = pop();

    push_integer(2 * i + 1);
    push(X);
    multiply();
    push(Y1);
    multiply();

    push_integer(i);
    push(Y0);
    multiply();

    subtract();

    push_integer(i + 1);
    divide();
  }

  for (let i = 0; i < m; i++) {
    push(X);
    derivative();
  }
}

// moveTos tos * (-1)^m * (1-x^2)^(m/2)
function __legendre3(m: number, X: U) {
  if (m === 0) {
    return;
  }

  if (car(X) === symbol(COS)) {
    push(cadr(X));
    sine();
    square();
  } else if (car(X) === symbol(SIN)) {
    push(cadr(X));
    cosine();
    square();
  } else {
    push_integer(1);
    push(X);
    square();
    subtract();
  }

  push_integer(m);
  push_rational(1, 2);
  multiply();
  power();
  multiply();

  if (m % 2) {
    negate();
  }
}
