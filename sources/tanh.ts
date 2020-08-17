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
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double } from './bignum';
import { Eval } from './eval';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
//             exp(2 x) - 1
//  tanh(x) = --------------
//             exp(2 x) + 1
export function Eval_tanh(p1: U) {
  push(cadr(p1));
  Eval();
  p1 = pop();
  if (car(p1) === symbol(ARCTANH)) {
    push(cadr(p1));
    return;
  }
  if (isdouble(p1)) {
    let d = Math.tanh(p1.d);
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
  push_symbol(TANH);
  push(p1);
  list(2);
}
