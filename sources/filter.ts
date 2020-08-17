import { alloc_tensor } from '../runtime/alloc';
import {
  ADD,
  car,
  cdr,
  iscons,
  istensor,
  symbol,
  Tensor,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { pop, push } from '../runtime/stack';
import { add } from './add';
import { push_integer } from './bignum';
import { Eval } from './eval';
/*
Remove terms that involve a given symbol or expression. For example...

  filter(x^2 + x + 1, x)    =>  1

  filter(x^2 + x + 1, x^2)  =>  x + 1
*/
export function Eval_filter(p1: U) {
  p1 = cdr(p1);
  push(car(p1));
  Eval();
  p1 = cdr(p1);

  while (iscons(p1)) {
    push(car(p1));
    Eval();
    filter();
    p1 = cdr(p1);
  }
}

/*
 For example...

  push(F)
  push(X)
  filter()
  F = pop()
*/
export function filter() {
  const p2 = pop();
  const p1 = pop();
  filter_main(p1, p2);
}

function filter_main(p1: U, p2: U) {
  if (car(p1) === symbol(ADD)) {
    filter_sum(p1, p2);
  } else if (istensor(p1)) {
    filter_tensor(p1, p2);
  } else if (Find(p1, p2)) {
    push_integer(0);
  } else {
    push(p1);
  }
}

function filter_sum(p1: U, p2: U) {
  push_integer(0);
  p1 = cdr(p1);

  while (iscons(p1)) {
    push(car(p1));
    push(p2);
    filter();
    add();
    p1 = cdr(p1);
  }
}

function filter_tensor(p1: Tensor, p2: U) {
  const n = p1.tensor.nelem;
  const p3 = alloc_tensor(n);
  p3.tensor.ndim = p1.tensor.ndim;
  for (let i = 0; i < p1.tensor.ndim; i++) {
    p3.tensor.dim[i] = p1.tensor.dim[i];
  }
  for (let i = 0; i < n; i++) {
    push(p1.tensor.elem[i]);
    push(p2);
    filter();
    p3.tensor.elem[i] = pop();
  }
  push(p3);
}
