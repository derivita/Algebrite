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
import { pop, push } from '../runtime/stack';
import { equal } from '../sources/misc';
import { subtract } from './add';
import { Eval } from './eval';
import { filter } from './filter';
import { divide } from './multiply';
import { power } from './power';
import { subst } from './subst';
/* coeff =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
p,x,n

General description
-------------------
Returns the coefficient of x^n in polynomial p. The x argument can be omitted for polynomials in x.

*/
export function Eval_coeff(p1: U) {
  push(cadr(p1));
  Eval();

  push(caddr(p1));
  Eval();

  push(cadddr(p1));
  Eval();

  let N = pop();
  let X = pop();
  const P = pop();

  if (N === symbol(NIL)) {
    // only 2 args?
    N = X;
    X = symbol(SYMBOL_X);
  }

  push(P); // divide p by x^n
  push(X);
  push(N);
  power();
  divide();

  push(X); // keep the constant part
  filter();
}

//-----------------------------------------------------------------------------
//
//  Put polynomial coefficients on the stack
//
//  Input:  tos-2    p(x) (the polynomial)
//
//      tos-1    x (the variable)
//
//  Output:    Returns number of coefficients on stack
//
//      tos-n    Coefficient of x^0
//
//      tos-1    Coefficient of x^(n-1)
//
//-----------------------------------------------------------------------------

export function coeff() {
  let p3: U;
  let p2 = pop();
  let p1 = pop();

  const h = defs.tos;

  while (true) {
    push(p1);
    push(p2);
    push(defs.zero);
    subst();
    Eval();

    p3 = pop();
    push(p3);

    push(p1);
    push(p3);
    subtract();

    p1 = pop();

    if (equal(p1, defs.zero)) {
      const n = defs.tos - h;
      return n;
    }

    push(p1);
    push(p2);
    const prev_expanding = defs.expanding;
    defs.expanding = 1;
    divide();
    defs.expanding = prev_expanding;
    //console.log("just divided: " + stack[tos-1].toString())
    p1 = pop();
  }
}
