import { alloc_tensor } from '../runtime/alloc';
import { defs, istensor, Tensor, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { moveTos, push } from '../runtime/stack';
import { pop_integer } from './bignum';
import { check_tensor_dimensions } from './tensor';

// n is the total number of things on the stack. The first thing on the stack
// is the object to be indexed, followed by the indices themselves.

// called by Eval_index
export function index_function(n: number) {
  const s = defs.tos - n;
  let p1: U = defs.stack[s] as Tensor;

  const { ndim } = p1.tensor;

  const m = n - 1;

  if (m > ndim) {
    stop('too many indices for tensor');
  }

  let k = 0;

  for (let i = 0; i < m; i++) {
    push(defs.stack[s + i + 1]);
    const t = pop_integer();
    if (t < 1 || t > p1.tensor.dim[i]) {
      stop('index out of range');
    }
    k = k * p1.tensor.dim[i] + t - 1;
  }

  if (ndim === m) {
    moveTos(defs.tos - n);
    push(p1.tensor.elem[k]);
    return;
  }

  for (let i = m; i < ndim; i++) {
    k = k * p1.tensor.dim[i] + 0;
  }

  let nelem = 1;

  for (let i = m; i < ndim; i++) {
    nelem *= p1.tensor.dim[i];
  }

  const p2: U = alloc_tensor(nelem);

  p2.tensor.ndim = ndim - m;

  for (let i = m; i < ndim; i++) {
    p2.tensor.dim[i - m] = p1.tensor.dim[i];
  }

  for (let i = 0; i < nelem; i++) {
    p2.tensor.elem[i] = p1.tensor.elem[k + i];
  }

  check_tensor_dimensions(p1);
  check_tensor_dimensions(p2);

  moveTos(defs.tos - n);
  push(p2);
}

//-----------------------------------------------------------------------------
//
//  Input:    n    Number of args on stack
//
//      tos-n    Right-hand value
//
//      tos-n+1    Left-hand value
//
//      tos-n+2    First index
//
//      .
//      .
//      .
//
//      tos-1    Last index
//
//  Output:    Result on stack
//
//-----------------------------------------------------------------------------
export function set_component(n: number) {
  if (n < 3) {
    stop('error in indexed assign');
  }

  const s = defs.tos - n;
  const RVALUE = defs.stack[s];
  let LVALUE = defs.stack[s + 1];

  if (!istensor(LVALUE)) {
    stop(
      'error in indexed assign: assigning to something that is not a tensor'
    );
  }

  const { ndim } = LVALUE.tensor;

  const m = n - 2;

  if (m > ndim) {
    stop('error in indexed assign');
  }

  let k = 0;
  for (let i = 0; i < m; i++) {
    push(defs.stack[s + i + 2]);
    const t = pop_integer();
    if (t < 1 || t > LVALUE.tensor.dim[i]) {
      stop('error in indexed assign\n');
    }
    k = k * LVALUE.tensor.dim[i] + t - 1;
  }

  for (let i = m; i < ndim; i++) {
    k = k * LVALUE.tensor.dim[i] + 0;
  }

  // copy
  const TMP = alloc_tensor(LVALUE.tensor.nelem);

  TMP.tensor.ndim = LVALUE.tensor.ndim;

  for (let i = 0; i < LVALUE.tensor.ndim; i++) {
    TMP.tensor.dim[i] = LVALUE.tensor.dim[i];
  }

  for (let i = 0; i < LVALUE.tensor.nelem; i++) {
    TMP.tensor.elem[i] = LVALUE.tensor.elem[i];
  }

  check_tensor_dimensions(LVALUE);
  check_tensor_dimensions(TMP);

  LVALUE = TMP;

  if (ndim === m) {
    if (istensor(RVALUE)) {
      stop('error in indexed assign');
    }
    LVALUE.tensor.elem[k] = RVALUE;

    check_tensor_dimensions(LVALUE);

    moveTos(defs.tos - n);
    push(LVALUE);
    return;
  }

  // see if the rvalue matches
  if (!istensor(RVALUE)) {
    stop('error in indexed assign');
  }

  if (ndim - m !== RVALUE.tensor.ndim) {
    stop('error in indexed assign');
  }

  for (let i = 0; i < RVALUE.tensor.ndim; i++) {
    if (LVALUE.tensor.dim[m + i] !== RVALUE.tensor.dim[i]) {
      stop('error in indexed assign');
    }
  }

  // copy rvalue
  for (let i = 0; i < RVALUE.tensor.nelem; i++) {
    LVALUE.tensor.elem[k + i] = RVALUE.tensor.elem[i];
  }

  check_tensor_dimensions(LVALUE);
  check_tensor_dimensions(RVALUE);

  moveTos(defs.tos - n);

  push(LVALUE);
}
