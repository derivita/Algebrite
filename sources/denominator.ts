import {
  ADD,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  iscons,
  isrational,
  MULTIPLY,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { mp_denominator } from './bignum';
import { Eval } from './eval';
import { isnegativeterm, isplusone } from './is';
import { multiply_all, reciprocate } from './multiply';
import { rationalize } from './rationalize';
/* denominator =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the denominator of expression x.

*/
export function Eval_denominator(p1: U) {
  push(cadr(p1));
  Eval();
  denominator();
}

export function denominator() {
  let theArgument = pop();
  //console.trace "denominator of: " + theArgument

  if (car(theArgument) === symbol(ADD)) {
    push(theArgument);
    rationalize();
    theArgument = pop();
  }

  if (
    car(theArgument) === symbol(MULTIPLY) &&
    !isplusone(car(cdr(theArgument)))
  ) {
    const h = defs.tos;
    theArgument = cdr(theArgument);
    while (iscons(theArgument)) {
      push(car(theArgument));
      denominator();
      theArgument = cdr(theArgument);
    }
    multiply_all(defs.tos - h);
  } else if (isrational(theArgument)) {
    push(theArgument);
    mp_denominator();
  } else if (
    car(theArgument) === symbol(POWER) &&
    isnegativeterm(caddr(theArgument))
  ) {
    push(theArgument);
    reciprocate();
  } else {
    push(defs.one);
  }
}
