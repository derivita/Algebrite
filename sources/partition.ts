import { car, cdr, iscons } from '../runtime/defs';
import { Find } from '../runtime/find';
import { pop, push } from '../runtime/stack';
import { push_integer } from './bignum';
import { multiply } from './multiply';
/*
 Partition a term

  Input stack:

    term (factor or product of factors)

    free variable

  Output stack:

    constant expression

    variable expression
*/
export function partition() {
  const p2 = pop();
  let p1 = pop();

  push_integer(1);

  let p3 = pop();
  let p4 = p3;

  p1 = cdr(p1);

  while (iscons(p1)) {
    if (Find(car(p1), p2)) {
      push(p4);
      push(car(p1));
      multiply();
      p4 = pop();
    } else {
      push(p3);
      push(car(p1));
      multiply();
      p3 = pop();
    }
    p1 = cdr(p1);
  }

  push(p3);
  push(p4);
}
