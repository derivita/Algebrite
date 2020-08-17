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
//            exp(x) - exp(-x)
//  sinh(x) = ----------------
//                   2
export function Eval_sinh(p1: U) {
  push(cadr(p1));
  Eval();
  ysinh();
}

export function ysinh() {
  yysinh();
}

function yysinh() {
  const p1 = pop();
  if (car(p1) === symbol(ARCSINH)) {
    push(cadr(p1));
    return;
  }
  if (isdouble(p1)) {
    let d = Math.sinh(p1.d);
    if (Math.abs(d) < 1e-10) {
      d = 0.0;
    }
    push_double(d);
    return;
  }
  if (isZeroAtomOrTensor(p1)) {
    push(defs.zero);
    return;
  }
  push_symbol(SINH);
  push(p1);
  list(2);
}
