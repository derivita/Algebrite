import { cadr, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_integer } from './bignum';
import { Eval } from './eval';
import { isnonnegativeinteger } from './is';
import { mprime } from './mprime';

export function Eval_isprime(p1: U) {
  push(cadr(p1));
  Eval();
  p1 = pop();
  if (isnonnegativeinteger(p1) && mprime(p1.q.a)) {
    push_integer(1);
  } else {
    push_integer(0);
  }
}
