import { cadr, defs, ERF, isdouble, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double } from './bignum';
import { erfc } from './erfc';
import { Eval } from './eval';
import { isnegativeterm, isZeroAtomOrTensor } from './is';
import { list } from './list';
import { negate } from './multiply';
/* erf =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Authors
-------
philippe.billet@noos.fr

Parameters
----------
x

General description
-------------------
Error function erf(x).
erf(-x)=erf(x)

*/
export function Eval_erf(p1: U) {
  push(cadr(p1));
  Eval();
  yerf();
}

function yerf() {
  yyerf();
}

function yyerf() {
  const p1 = pop();

  if (isdouble(p1)) {
    const d = 1.0 - erfc(p1.d);
    push_double(d);
    return;
  }

  if (isZeroAtomOrTensor(p1)) {
    push(defs.zero);
    return;
  }

  if (isnegativeterm(p1)) {
    push_symbol(ERF);
    push(p1);
    negate();
    list(2);
    negate();
    return;
  }

  push_symbol(ERF);
  push(p1);
  list(2);
}
