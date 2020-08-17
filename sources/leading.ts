import { caddr, cadr, NIL, symbol, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { degree } from './degree';
import { Eval } from './eval';
import { filter } from './filter';
import { guess } from './guess';
import { divide } from './multiply';
import { power } from './power';
/*
 Return the leading coefficient of a polynomial.

Example

  leading(5x^2+x+1,x)

Result

  5

The result is undefined if P is not a polynomial.
*/
export function Eval_leading(p1: U) {
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  p1 = pop();
  if (p1 === symbol(NIL)) {
    guess();
  } else {
    push(p1);
  }
  leading();
}

function leading() {
  const X = pop();
  const P = pop();

  push(P); // N = degree of P
  push(X);
  degree();
  const N = pop();

  push(P); // divide through by X ^ N
  push(X);
  push(N);
  power();
  divide();

  push(X); // remove terms that depend on X
  filter();
}
