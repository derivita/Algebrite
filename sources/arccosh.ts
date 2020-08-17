import {
  ARCCOSH,
  cadr,
  car,
  COSH,
  defs,
  isdouble,
  symbol,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double } from './bignum';
import { Eval } from './eval';
import { isplusone } from './is';
import { list } from './list';
/* arccosh =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse hyperbolic cosine of x.

*/
export function Eval_arccosh(x: U) {
  push(cadr(x));
  Eval();
  arccosh();
}

function arccosh() {
  let d = 0.0;
  let x = pop();
  if (car(x) === symbol(COSH)) {
    push(cadr(x));
    return;
  }

  if (isdouble(x)) {
    ({ d } = x);
    if (d < 1.0) {
      stop('arccosh function argument is less than 1.0');
    }
    d = Math.log(d + Math.sqrt(d * d - 1.0));
    push_double(d);
    return;
  }

  if (isplusone(x)) {
    push(defs.zero);
    return;
  }

  push_symbol(ARCCOSH);
  push(x);
  list(2);
}
