import {
  caddr,
  cadr,
  isdouble,
  isNumericAtom,
  MOD,
  Num,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { pop_integer, push_integer } from './bignum';
import { Eval } from './eval';
import { isinteger, isZeroAtomOrTensor } from './is';
import { list } from './list';
import { mmod } from './mmul';
export function Eval_mod(p1: U) {
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  mod();
}

function mod() {
  let p2 = pop();
  let p1 = pop();

  if (isZeroAtomOrTensor(p2)) {
    stop('mod function: divide by zero');
  }

  if (!isNumericAtom(p1) || !isNumericAtom(p2)) {
    push_symbol(MOD);
    push(p1);
    push(p2);
    list(3);
    return;
  }

  if (isdouble(p1)) {
    push(p1);
    const n = pop_integer();
    if (isNaN(n)) {
      stop('mod function: cannot convert float value to integer');
    }
    push_integer(n);
    p1 = pop();
  }

  if (isdouble(p2)) {
    push(p2);
    const n = pop_integer();
    if (isNaN(n)) {
      stop('mod function: cannot convert float value to integer');
    }
    push_integer(n);
    p2 = pop();
  }

  if (!isinteger(p1) || !isinteger(p2)) {
    stop('mod function: integer arguments expected');
  }

  const p3 = new Num(mmod(p1.q.a, p2.q.a));
  push(p3);
}
