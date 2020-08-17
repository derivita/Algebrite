import {
  cadddr,
  caddr,
  cadr,
  issymbol,
  LAGUERRE,
  NIL,
  SECRETX,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { pop_integer, push_integer } from './bignum';
import { Eval } from './eval';
import { list } from './list';
import { divide, multiply } from './multiply';
import { subst } from './subst';
/*
 Laguerre function

Example

  laguerre(x,3)

Result

     1   3    3   2
  - --- x  + --- x  - 3 x + 1
     6        2

The computation uses the following recurrence relation.

  L(x,0,k) = 1

  L(x,1,k) = -x + k + 1

  n*L(x,n,k) = (2*(n-1)+1-x+k)*L(x,n-1,k) - (n-1+k)*L(x,n-2,k)

In the "for" loop i = n-1 so the recurrence relation becomes

  (i+1)*L(x,n,k) = (2*i+1-x+k)*L(x,n-1,k) - (i+k)*L(x,n-2,k)
*/
export function Eval_laguerre(p1: U) {
  let p2: U;
  // 1st arg
  push(cadr(p1));
  Eval();

  // 2nd arg
  push(caddr(p1));
  Eval();

  // 3rd arg
  push(cadddr(p1));
  Eval();

  p2 = pop();
  if (p2 === symbol(NIL)) {
    push_integer(0);
  } else {
    push(p2);
  }

  laguerre();
}

function laguerre() {
  let n = 0;

  const K = pop();
  const N = pop();
  let X = pop();

  push(N);
  n = pop_integer();

  if (n < 0 || isNaN(n)) {
    push_symbol(LAGUERRE);
    push(X);
    push(N);
    push(K);
    list(4);
    return;
  }

  if (issymbol(X)) {
    laguerre2(n, X, K);
  } else {
    const Y = X; // do this when p1 is an expr
    X = symbol(SECRETX);
    laguerre2(n, X, K);
    X = Y;
    push(symbol(SECRETX));
    push(X);
    subst();
    Eval();
  }
}

function laguerre2(n: number, p1: U, p3: U) {
  push_integer(1);
  push_integer(0);

  let Y1: U = pop();

  for (let i = 0; i < n; i++) {
    const Y0 = Y1;

    Y1 = pop();

    push_integer(2 * i + 1);
    push(p1);
    subtract();
    push(p3);
    add();
    push(Y1);
    multiply();

    push_integer(i);
    push(p3);
    add();
    push(Y0);
    multiply();

    subtract();

    push_integer(i + 1);
    divide();
  }
}
