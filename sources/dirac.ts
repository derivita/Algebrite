import {
  ADD,
  cadr,
  car,
  DIRAC,
  isdouble,
  isrational,
  MZERO,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_integer } from './bignum';
import { Eval } from './eval';
import { isnegativeterm } from './is';
import { list } from './list';
import { mmul } from './mmul';
import { negate } from './multiply';
//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  Dirac function dirac(x)
//  dirac(-x)=dirac(x)
//  dirac(b-a)=dirac(a-b)
//-----------------------------------------------------------------------------
export function Eval_dirac(p1: U) {
  push(cadr(p1));
  Eval();
  dirac();
}

export function dirac() {
  ydirac();
}

function ydirac() {
  let p1 = pop();

  if (isdouble(p1)) {
    if (p1.d === 0) {
      push_integer(1);
      return;
    } else {
      push_integer(0);
      return;
    }
  }

  if (isrational(p1)) {
    if (MZERO(mmul(p1.q.a, p1.q.b))) {
      push_integer(1);
      return;
    } else {
      push_integer(0);
      return;
    }
  }

  if (car(p1) === symbol(POWER)) {
    push_symbol(DIRAC);
    push(cadr(p1));
    list(2);
    return;
  }

  if (isnegativeterm(p1)) {
    push_symbol(DIRAC);
    push(p1);
    negate();
    list(2);
    return;
  }

  if (
    isnegativeterm(p1) ||
    (car(p1) === symbol(ADD) && isnegativeterm(cadr(p1)))
  ) {
    push(p1);
    negate();
    p1 = pop();
  }

  push_symbol(DIRAC);
  push(p1);
  list(2);
}
