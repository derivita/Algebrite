import {
  BESSELJ,
  caddr,
  cadr,
  defs,
  isdouble,
  MEQUAL,
  MSIGN,
  NUM,
  PI,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { subtract } from './add';
import {
  pop_integer,
  push_double,
  push_integer,
  push_rational,
} from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { isnegativeterm, isZeroAtomOrTensor } from './is';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { sine } from './sin';
import { jn } from '../runtime/otherCFunctions';
/* besselj =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x,n

General description
-------------------

Returns a solution to the Bessel differential equation (Bessel function of first kind).

Recurrence relation:

  besselj(x,n) = (2/x) (n-1) besselj(x,n-1) - besselj(x,n-2)

  besselj(x,1/2) = sqrt(2/pi/x) sin(x)

  besselj(x,-1/2) = sqrt(2/pi/x) cos(x)

For negative n, reorder the recurrence relation as:

  besselj(x,n-2) = (2/x) (n-1) besselj(x,n-1) - besselj(x,n)

Substitute n+2 for n to obtain

  besselj(x,n) = (2/x) (n+1) besselj(x,n+1) - besselj(x,n+2)

Examples:

  besselj(x,3/2) = (1/x) besselj(x,1/2) - besselj(x,-1/2)

  besselj(x,-3/2) = -(1/x) besselj(x,-1/2) - besselj(x,1/2)

*/
export function Eval_besselj(p1: U) {
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  besselj();
}

export function besselj() {
  yybesselj();
}

function yybesselj() {
  const N = pop();
  const X = pop();

  push(N);
  const n = pop_integer();

  // numerical result
  if (isdouble(X) && !isNaN(n)) {
    const d = jn(n, X.d);
    push_double(d);
    return;
  }

  // bessej(0,0) = 1
  if (isZeroAtomOrTensor(X) && isZeroAtomOrTensor(N)) {
    push_integer(1);
    return;
  }

  // besselj(0,n) = 0
  if (isZeroAtomOrTensor(X) && !isNaN(n)) {
    push_integer(0);
    return;
  }

  // half arguments
  if (N.k === NUM && MEQUAL(N.q.b, 2)) {
    // n = 1/2
    if (MEQUAL(N.q.a, 1)) {
      if (defs.evaluatingAsFloats) {
        push_double(2.0 / Math.PI);
      } else {
        push_integer(2);
        push_symbol(PI);
        divide();
      }
      push(X);
      divide();
      push_rational(1, 2);
      power();
      push(X);
      sine();
      multiply();
      return;
    }

    // n = -1/2
    if (MEQUAL(N.q.a, -1)) {
      if (defs.evaluatingAsFloats) {
        push_double(2.0 / Math.PI);
      } else {
        push_integer(2);
        push_symbol(PI);
        divide();
      }
      push(X);
      divide();
      push_rational(1, 2);
      power();
      push(X);
      cosine();
      multiply();
      return;
    }

    // besselj(x,n) = (2/x) (n-sgn(n)) besselj(x,n-sgn(n)) - besselj(x,n-2*sgn(n))
    push_integer(MSIGN(N.q.a));
    const SGN = pop();

    push_integer(2);
    push(X);
    divide();
    push(N);
    push(SGN);
    subtract();
    multiply();
    push(X);
    push(N);
    push(SGN);
    subtract();
    besselj();
    multiply();
    push(X);
    push(N);
    push_integer(2);
    push(SGN);
    multiply();
    subtract();
    besselj();
    subtract();
    return;
  }

  //if 0 # test cases needed
  if (isnegativeterm(X)) {
    push(X);
    negate();
    push(N);
    power();
    push(X);
    push(N);
    negate();
    power();
    multiply();
    push_symbol(BESSELJ);
    push(X);
    negate();
    push(N);
    list(3);
    multiply();
    return;
  }

  if (isnegativeterm(N)) {
    push_integer(-1);
    push(N);
    power();
    push_symbol(BESSELJ);
    push(X);
    push(N);
    negate();
    list(3);
    multiply();
    return;
  }

  push(symbol(BESSELJ));
  push(X);
  push(N);
  list(3);
}
