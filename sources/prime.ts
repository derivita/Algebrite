import { cadr, MAXPRIMETAB, primetab, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { push } from '../runtime/stack';
import { pop_integer, push_integer } from './bignum';
import { Eval } from './eval';
//-----------------------------------------------------------------------------
//
//  Look up the nth prime
//
//  Input:    n on stack (0 < n < 10001)
//
//  Output:    nth prime on stack
//
//-----------------------------------------------------------------------------
export function Eval_prime(p1: U) {
  push(cadr(p1));
  Eval();
  prime();
}

function prime() {
  let n = pop_integer();
  if (n < 1 || n > MAXPRIMETAB) {
    stop('prime: Argument out of range.');
  }
  n = primetab[n - 1];
  push_integer(n);
}
