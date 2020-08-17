import { gcd } from './gcd';
import { car, cdr, defs, iscons, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { Eval } from './eval';
import { divide, inverse } from './multiply';
// Find the least common multiple of two expressions.
export function Eval_lcm(p1: U) {
  p1 = cdr(p1);
  push(car(p1));
  Eval();
  p1 = cdr(p1);

  while (iscons(p1)) {
    push(car(p1));
    Eval();
    lcm();
    p1 = cdr(p1);
  }
}

export function lcm() {
  const prev_expanding = defs.expanding;
  yylcm();
  defs.expanding = prev_expanding;
}

function yylcm() {
  defs.expanding = 1;

  const p2 = pop();
  const p1 = pop();

  push(p1);
  push(p2);
  gcd();

  push(p1);
  divide();

  push(p2);
  divide();

  inverse();
}
