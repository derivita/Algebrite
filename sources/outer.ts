import { alloc_tensor } from '../runtime/alloc';
import { car, cdr, iscons, istensor, MAXDIM, Tensor, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { Eval } from './eval';
import { multiply } from './multiply';
import { scalar_times_tensor, tensor_times_scalar } from './tensor';
// Outer product of tensors
export function Eval_outer(p1: U) {
  p1 = cdr(p1);
  push(car(p1));
  Eval();
  p1 = cdr(p1);

  while (iscons(p1)) {
    push(car(p1));
    Eval();
    outer();
    p1 = cdr(p1);
  }
}

function outer() {
  const p2 = pop();
  const p1 = pop();
  if (istensor(p1) && istensor(p2)) {
    yyouter(p1, p2);
  } else {
    push(p1);
    push(p2);
    if (istensor(p1)) {
      tensor_times_scalar();
    } else if (istensor(p2)) {
      scalar_times_tensor();
    } else {
      multiply();
    }
  }
}

function yyouter(p1: Tensor, p2: Tensor) {
  const ndim = p1.tensor.ndim + p2.tensor.ndim;
  if (ndim > MAXDIM) {
    stop('outer: rank of result exceeds maximum');
  }

  const nelem = p1.tensor.nelem * p2.tensor.nelem;
  const p3 = alloc_tensor(nelem);

  p3.tensor.ndim = ndim;
  let i = 0;
  for (i = 0; i < p1.tensor.ndim; i++) {
    p3.tensor.dim[i] = p1.tensor.dim[i];
  }

  const j = i;
  for (let i = 0; i < p2.tensor.ndim; i++) {
    p3.tensor.dim[j + i] = p2.tensor.dim[i];
  }

  let k = 0;
  for (let i = 0; i < p1.tensor.nelem; i++) {
    for (let j = 0; j < p2.tensor.nelem; j++) {
      push(p1.tensor.elem[i]);
      push(p2.tensor.elem[j]);
      multiply();
      p3.tensor.elem[k++] = pop();
    }
  }

  push(p3);
}
