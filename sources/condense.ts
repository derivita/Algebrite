import { gcd } from './gcd';
import { ADD, cadr, car, cdr, defs, iscons, symbol, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { yyexpand } from '../sources/misc';
import { add } from './add';
import { Eval } from './eval';
import { divide, inverse, multiply_noexpand } from './multiply';
// Condense an expression by factoring common terms.

export function Eval_condense(p1: U) {
  push(cadr(p1));
  Eval();
  Condense();
}

export function Condense() {
  const prev_expanding = defs.expanding;
  defs.expanding = 0;
  yycondense();
  defs.expanding = prev_expanding;
}

export function yycondense() {
  //expanding = 0
  const p1 = pop();

  if (car(p1) !== symbol(ADD)) {
    push(p1);
    return;
  }

  // get gcd of all terms

  let p3 = cdr(p1);
  push(car(p3));
  p3 = cdr(p3);
  while (iscons(p3)) {
    push(car(p3));
    //console.log "calculating gcd between: " + stack[tos - 1] + " and " + stack[tos - 2]
    gcd();
    //console.log "partial gcd: " + stack[tos - 1]
    p3 = cdr(p3);
  }

  //console.log "condense: this is the gcd of all the terms: " + stack[tos - 1]

  // divide each term by gcd

  inverse();
  const p2 = pop();
  push(defs.zero);
  p3 = cdr(p1);
  while (iscons(p3)) {
    push(p2);
    push(car(p3));
    //multiply()
    multiply_noexpand();
    add();
    p3 = cdr(p3);
  }

  // We multiplied above w/o expanding so some factors cancelled.

  // Now we expand which normalizes the result and, in some cases,
  // simplifies it too (see test case H).

  yyexpand();

  // multiply result by gcd

  push(p2);
  divide();
}
