import {
  caddr,
  cadr,
  car,
  cdr,
  defs,
  iscons,
  isNumericAtom,
  NIL,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { equal, lessp } from '../sources/misc';
import { Eval } from './eval';
import { guess } from './guess';
import { isZeroAtomOrTensor } from './is';
/* deg =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
p,x

General description
-------------------
Returns the degree of polynomial p(x).

*/
export function Eval_degree(p1: U) {
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  p1 = pop();
  if (p1 === symbol(NIL)) {
    guess();
  } else {
    push(p1);
  }
  degree();
}

//-----------------------------------------------------------------------------
//
//  Find the degree of a polynomial
//
//  Input:    tos-2    p(x)
//
//      tos-1    x
//
//  Output:    Result on stack
//
//  Note: Finds the largest numerical power of x. Does not check for
//  weirdness in p(x).
//
//-----------------------------------------------------------------------------
export function degree() {
  const X = pop();
  const POLY = pop();
  let DEGREE: U = defs.zero;
  [DEGREE] = yydegree(POLY, X, DEGREE);
  push(DEGREE);
}

function yydegree(POLY: U, X: U, DEGREE: U): [U] {
  if (equal(POLY, X)) {
    if (isZeroAtomOrTensor(DEGREE)) {
      DEGREE = defs.one;
    }
  } else if (car(POLY) === symbol(POWER)) {
    if (
      equal(cadr(POLY), X) &&
      isNumericAtom(caddr(POLY)) &&
      lessp(DEGREE, caddr(POLY))
    ) {
      DEGREE = caddr(POLY);
    }
  } else if (iscons(POLY)) {
    POLY = cdr(POLY);

    while (iscons(POLY)) {
      [DEGREE] = yydegree(car(POLY), X, DEGREE);
      POLY = cdr(POLY);
    }
  }
  return [DEGREE];
}
