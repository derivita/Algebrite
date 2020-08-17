import { HERMITE, issymbol, SECRETX, symbol, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { subtract } from './add';
import { pop_integer, push_integer } from './bignum';
import { Eval } from './eval';
import { list } from './list';
import { multiply } from './multiply';
import { subst } from './subst';
//-----------------------------------------------------------------------------
//
//  Hermite polynomial
//
//  Input:    tos-2    x  (can be a symbol or expr)
//
//      tos-1    n
//
//  Output:    Result on stack
//
//-----------------------------------------------------------------------------
export function hermite() {
  yyhermite();
}

// uses the recurrence relation H(x,n+1)=2*x*H(x,n)-2*n*H(x,n-1)
function yyhermite() {
  const N = pop();
  let X = pop();

  push(N);
  const n = pop_integer();

  if (n < 0 || isNaN(n)) {
    push_symbol(HERMITE);
    push(X);
    push(N);
    list(3);
    return;
  }

  if (issymbol(X)) {
    yyhermite2(n, X);
  } else {
    const Y = X; // do this when X is an expr
    X = symbol(SECRETX);
    yyhermite2(n, X);
    X = Y;
    push(symbol(SECRETX));
    push(X);
    subst();
    Eval();
  }
}

function yyhermite2(n: number, p1: U) {
  push_integer(1);
  push_integer(0);

  let Y1: U = pop();

  for (let i = 0; i < n; i++) {
    const Y0: U = Y1;

    Y1 = pop();

    push(p1);
    push(Y1);
    multiply();

    push_integer(i);
    push(Y0);
    multiply();

    subtract();

    push_integer(2);
    multiply();
  }
}
