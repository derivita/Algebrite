import { BESSELY, caddr, cadr, isdouble, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { pop_integer, push_double, push_integer } from './bignum';
import { Eval } from './eval';
import { isnegativeterm } from './is';
import { list } from './list';
import { multiply, negate } from './multiply';
import { power } from './power';
import { yn } from '../runtime/otherCFunctions';
/* bessely =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x,n

General description
-------------------

Bessel function of second kind.

*/
export function Eval_bessely(p1: U) {
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  bessely();
}

export function bessely() {
  yybessely();
}

function yybessely() {
  const N = pop();
  const X = pop();

  push(N);
  const n = pop_integer();

  if (isdouble(X) && !isNaN(n)) {
    const d = yn(n, X.d);
    push_double(d);
    return;
  }

  if (isnegativeterm(N)) {
    push_integer(-1);
    push(N);
    power();
    push_symbol(BESSELY);
    push(X);
    push(N);
    negate();
    list(3);
    multiply();
    return;
  }

  push_symbol(BESSELY);
  push(X);
  push(N);
  list(3);
}
