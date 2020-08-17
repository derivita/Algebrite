import { alloc_tensor } from '../runtime/alloc';
import { car, cdr, defs, iscons, MAXDIM, U } from '../runtime/defs';
import { push } from '../runtime/stack';
import { pop_integer } from './bignum';
import { Eval } from './eval';
export function Eval_zero(p1: U) {
  const k: number[] = [];
  for (let i = 0; i < MAXDIM; i++) {
    k[i] = 0;
  }

  let m = 1;
  let n = 0;
  let p2 = cdr(p1);

  while (iscons(p2)) {
    push(car(p2));
    Eval();
    let i = pop_integer();
    if (i < 1 || isNaN(i)) {
      // if the input is nonsensical
      // just return 0
      push(defs.zero);
      return;
    }
    m *= i;
    k[n++] = i;
    p2 = cdr(p2);
  }
  if (n === 0) {
    push(defs.zero);
    return;
  }
  p1 = alloc_tensor(m);
  p1.tensor.ndim = n;
  for (let i = 0; i < n; i++) {
    p1.tensor.dim[i] = k[i];
  }
  push(p1);
}
