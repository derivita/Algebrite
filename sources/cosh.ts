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
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double } from './bignum';
import { Eval } from './eval';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
/* cosh =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the hyperbolic cosine of x

```
            exp(x) + exp(-x)
  cosh(x) = ----------------
                   2
```

*/
export function Eval_cosh(p1: U) {
  push(cadr(p1));
  Eval();
  ycosh();
}

export function ycosh() {
  yycosh();
}

function yycosh() {
  let p1: U;
  let d = 0.0;
  p1 = pop();
  if (car(p1) === symbol(ARCCOSH)) {
    push(cadr(p1));
    return;
  }
  if (isdouble(p1)) {
    d = Math.cosh(p1.d);
    if (Math.abs(d) < 1e-10) {
      d = 0.0;
    }
    push_double(d);
    return;
  }
  if (isZeroAtomOrTensor(p1)) {
    push(defs.one);
    return;
  }
  push_symbol(COSH);
  push(p1);
  list(2);
}
