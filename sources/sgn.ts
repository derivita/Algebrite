import {
  cadr,
  isdouble,
  isrational,
  MSIGN,
  MZERO,
  SGN,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { absval } from './abs';
import { push_integer } from './bignum';
import { Eval } from './eval';
import { iscomplexnumber, isnegativeterm } from './is';
import { list } from './list';
import { mmul } from './mmul';
import { multiply, negate } from './multiply';
import { power } from './power';
//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  sgn sign function
//
//
//-----------------------------------------------------------------------------
export function Eval_sgn(p1: U) {
  push(cadr(p1));
  Eval();
  sgn();
}

export function sgn() {
  yysgn();
}

function yysgn() {
  const X = pop();

  if (isdouble(X)) {
    if (X.d > 0) {
      push_integer(1);
      return;
    } else {
      if (X.d === 0) {
        push_integer(1);
        return;
      } else {
        push_integer(-1);
        return;
      }
    }
  }

  if (isrational(X)) {
    if (MSIGN(mmul(X.q.a, X.q.b)) === -1) {
      push_integer(-1);
      return;
    } else {
      if (MZERO(mmul(X.q.a, X.q.b))) {
        push_integer(0);
        return;
      } else {
        push_integer(1);
        return;
      }
    }
  }

  if (iscomplexnumber(X)) {
    push_integer(-1);
    push(X);
    absval();
    power();
    push(X);
    multiply();
    return;
  }

  if (isnegativeterm(X)) {
    push_symbol(SGN);
    push(X);
    negate();
    list(2);
    push_integer(-1);
    multiply();
    return;
  }

  /*
  push_integer(2)
  push(X)
  heaviside()
  multiply()
  push_integer(-1)
  add()
  */

  push_symbol(SGN);
  push(X);
  list(2);
}
