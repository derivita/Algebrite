import {
  cadr,
  Double,
  isdouble,
  isNumericAtom,
  ROUND,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double, push_integer } from './bignum';
import { Eval } from './eval';
import { yyfloat } from './float';
import { isinteger } from './is';
import { list } from './list';

export function Eval_round(p1: U) {
  push(cadr(p1));
  Eval();
  yround();
}

function yround() {
  yyround();
}

function yyround() {
  let p1: U;
  let d = 0.0;

  p1 = pop();

  if (!isNumericAtom(p1)) {
    push_symbol(ROUND);
    push(p1);
    list(2);
    return;
  }

  if (isdouble(p1)) {
    d = Math.round(p1.d);
    push_double(d);
    return;
  }

  if (isinteger(p1)) {
    push(p1);
    return;
  }

  push(p1);
  yyfloat();
  p1 = pop() as Double;
  push_integer(Math.round(p1.d));
}
