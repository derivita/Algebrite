import {
  cadr,
  CEILING,
  isdouble,
  isNumericAtom,
  Num,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add } from './add';
import { push_double, push_integer } from './bignum';
import { Eval } from './eval';
import { isinteger, isnegativenumber } from './is';
import { list } from './list';
import { mdiv } from './mmul';
/* ceiling =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------

Returns the smallest integer not less than x.

*/
export function Eval_ceiling(p1: U) {
  push(cadr(p1));
  Eval();
  ceiling();
}

function ceiling() {
  yyceiling();
}

function yyceiling() {
  const p1 = pop();

  if (!isNumericAtom(p1)) {
    push_symbol(CEILING);
    push(p1);
    list(2);
    return;
  }

  if (isdouble(p1)) {
    const d = Math.ceil(p1.d);
    push_double(d);
    return;
  }

  if (isinteger(p1)) {
    push(p1);
    return;
  }

  const p3 = new Num(mdiv(p1.q.a, p1.q.b));
  push(p3);

  if (isnegativenumber(p1)) {
    // do nothing
  } else {
    push_integer(1);
    add();
  }
}
