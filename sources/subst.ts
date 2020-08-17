import { alloc_tensor } from '../runtime/alloc';
import { car, cdr, iscons, istensor, NIL, symbol } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { equal } from '../sources/misc';
import { cons } from './cons';
import { check_tensor_dimensions } from './tensor';
/*
  Substitute new expr for old expr in expr.

  Input:  push  expr

    push  old expr

    push  new expr

  Output:  Result on stack
*/
export function subst() {
  const p3 = pop(); // new expr
  const p2 = pop(); // old expr
  if (p2 === symbol(NIL) || p3 === symbol(NIL)) {
    return;
  }
  const p1 = pop(); // expr
  if (istensor(p1)) {
    const p4 = alloc_tensor(p1.tensor.nelem);
    p4.tensor.ndim = p1.tensor.ndim;
    for (let i = 0; i < p1.tensor.ndim; i++) {
      p4.tensor.dim[i] = p1.tensor.dim[i];
    }
    for (let i = 0; i < p1.tensor.nelem; i++) {
      push(p1.tensor.elem[i]);
      push(p2);
      push(p3);
      subst();
      p4.tensor.elem[i] = pop();

      check_tensor_dimensions(p4);
    }

    push(p4);
  } else if (equal(p1, p2)) {
    push(p3);
  } else if (iscons(p1)) {
    push(car(p1));
    push(p2);
    push(p3);
    subst();
    push(cdr(p1));
    push(p2);
    push(p3);
    subst();
    cons();
  } else {
    push(p1);
  }
}
