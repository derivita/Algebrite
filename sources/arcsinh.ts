import {
  ARCSINH,
  cadr,
  car,
  defs,
  isdouble,
  SINH,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double } from './bignum';
import { Eval } from './eval';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
/* arcsinh =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse hyperbolic sine of x.

*/
export function Eval_arcsinh(x: U) {
  push(cadr(x));
  Eval();
  arcsinh();
}

function arcsinh() {
  let d = 0.0;
  let x: U = pop();
  if (car(x) === symbol(SINH)) {
    push(cadr(x));
    return;
  }

  if (isdouble(x)) {
    ({ d } = x);
    d = Math.log(d + Math.sqrt(d * d + 1.0));
    push_double(d);
    return;
  }

  if (isZeroAtomOrTensor(x)) {
    push(defs.zero);
    return;
  }

  push_symbol(ARCSINH);
  push(x);
  list(2);
}
