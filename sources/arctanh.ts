import {
  ARCTANH,
  cadr,
  car,
  defs,
  isdouble,
  symbol,
  TANH,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double } from './bignum';
import { Eval } from './eval';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
/* arctanh =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse hyperbolic tangent of x.

*/
export function Eval_arctanh(x: U) {
  push(cadr(x));
  Eval();
  arctanh();
}

function arctanh() {
  let d = 0.0;
  const x: U = pop();
  if (car(x) === symbol(TANH)) {
    push(cadr(x));
    return;
  }

  if (isdouble(x)) {
    ({ d } = x);
    if (d < -1.0 || d > 1.0) {
      stop('arctanh function argument is not in the interval [-1,1]');
    }
    d = Math.log((1.0 + d) / (1.0 - d)) / 2.0;
    push_double(d);
    return;
  }

  if (isZeroAtomOrTensor(x)) {
    push(defs.zero);
    return;
  }

  push_symbol(ARCTANH);
  push(x);
  list(2);
}
