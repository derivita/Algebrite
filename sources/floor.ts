import { cadr, FLOOR, isdouble, isNumericAtom, Num, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add } from './add';
import { push_double, push_integer } from './bignum';
import { Eval } from './eval';
import { isinteger, isnegativenumber } from './is';
import { list } from './list';
import { mdiv } from './mmul';
export function Eval_floor(p1: U) {
  push(cadr(p1));
  Eval();
  yfloor();
}

function yfloor() {
  yyfloor();
}

function yyfloor() {
  const p1 = pop();

  if (!isNumericAtom(p1)) {
    push_symbol(FLOOR);
    push(p1);
    list(2);
    return;
  }

  if (isdouble(p1)) {
    const d = Math.floor(p1.d);
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
    push_integer(-1);
    add();
  }
}
