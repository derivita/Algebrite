import { caddr, cadr, defs, isNumericAtom, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { lessp } from '../sources/misc';
import { subtract } from './add';
import { Eval } from './eval';
import { factorial } from './factorial';
import { divide } from './multiply';
//  Binomial coefficient
//
//  Input:    tos-2    n
//
//      tos-1    k
//
//  Output:    Binomial coefficient on stack
//
//  binomial(n, k) = n! / k! / (n - k)!
//
//  The binomial coefficient vanishes for k < 0 or k > n. (A=B, p. 19)

export function Eval_binomial(p1: U) {
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  binomial();
}

function binomial() {
  ybinomial();
}

function ybinomial() {
  const K = pop();
  const N = pop();

  if (!BINOM_check_args(N, K)) {
    push(defs.zero);
    return;
  }

  push(N);
  factorial();

  push(K);
  factorial();

  divide();

  push(N);
  push(K);
  subtract();
  factorial();

  divide();
}

function BINOM_check_args(N: U, K: U): boolean {
  if (isNumericAtom(N) && lessp(N, defs.zero)) {
    return false;
  } else if (isNumericAtom(K) && lessp(K, defs.zero)) {
    return false;
  } else if (isNumericAtom(N) && isNumericAtom(K) && lessp(N, K)) {
    return false;
  } else {
    return true;
  }
}
