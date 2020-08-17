import { car, cdr, NIL, symbol, TAYLOR, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { pop_integer, push_integer } from './bignum';
import { derivative } from './derivative';
import { Eval } from './eval';
import { factorial } from './factorial';
import { guess } from './guess';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
import { divide, multiply } from './multiply';
import { subst } from './subst';
/*
Taylor expansion of a function

  push(F)
  push(X)
  push(N)
  push(A)
  taylor()
*/
export function Eval_taylor(p1: U) {
  let p2: U;
  // 1st arg
  p1 = cdr(p1);
  push(car(p1));
  Eval();

  // 2nd arg
  p1 = cdr(p1);
  push(car(p1));
  Eval();
  p2 = pop();
  if (p2 === symbol(NIL)) {
    guess();
  } else {
    push(p2);
  }

  // 3rd arg
  p1 = cdr(p1);
  push(car(p1));
  Eval();
  p2 = pop();
  if (p2 === symbol(NIL)) {
    push_integer(24); // default number of terms
  } else {
    push(p2);
  }

  // 4th arg
  p1 = cdr(p1);
  push(car(p1));
  Eval();
  p2 = pop();
  if (p2 === symbol(NIL)) {
    push_integer(0); // default expansion point
  } else {
    push(p2);
  }

  taylor();
}

function taylor() {
  const A = pop();
  const N = pop();
  const X = pop();
  let F = pop();

  push(N);
  const k = pop_integer();
  if (isNaN(k)) {
    push_symbol(TAYLOR);
    push(F);
    push(X);
    push(N);
    push(A);
    list(5);
    return;
  }

  push(F); // f(a)
  push(X);
  push(A);
  subst();
  Eval();

  push_integer(1);
  let p5 = pop();

  for (let i = 1; i <= k; i++) {
    push(F); // f = f'
    push(X);
    derivative();
    F = pop();

    if (isZeroAtomOrTensor(F)) {
      break;
    }

    push(p5); // c = c * (x - a)
    push(X);
    push(A);
    subtract();
    multiply();
    p5 = pop();

    push(F); // f(a)
    push(X);
    push(A);
    subst();
    Eval();

    push(p5);
    multiply();
    push_integer(i);
    factorial();
    divide();

    add();
  }
}
