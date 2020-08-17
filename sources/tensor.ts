import { alloc_tensor } from '../runtime/alloc';
import {
  defs,
  DERIVATIVE,
  istensor,
  MAXDIM,
  NIL,
  POWER,
  Sign,
  symbol,
  Tensor,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push, top } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { equal, lessp } from '../sources/misc';
import { add } from './add';
import { pop_integer } from './bignum';
import { derivative } from './derivative';
import { Eval } from './eval';
import { inner } from './inner';
import { inv } from './inv';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
import { multiply } from './multiply';
//(docs are generated from top-level comments, keep an eye on the formatting!)

/* tensor =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

General description
-------------------
Tensors are a strange in-between of matrices and "computer"
rectangular data structures.

Tensors, unlike matrices, and like rectangular data structures,
can have an arbitrary number of dimensions (rank), although a tensor with
rank zero is just a scalar.

Tensors, like matrices and unlike many computer rectangular data structures,
must be "contiguous" i.e. have no empty spaces within its size, and "uniform",
i.e. each element must have the same shape and hence the same rank.

Also tensors have necessarily to make a distinction between row vectors,
column vectors (which have a rank of 2) and uni-dimensional vectors (rank 1).
They look very similar but they are fundamentally different.

Tensors are 1-indexed, as per general math notation, and like Fortran,
Lua, Mathematica, SASL, MATLAB, Julia, Erlang and APL.

Tensors with elements that are also tensors get promoted to a higher rank
, this is so we can represent and get the rank of a matrix correctly.
Example:
Start with a tensor of rank 1 with 2 elements (i.e. shape: 2)
if you put in both its elements another 2 tensors
of rank 1 with 2 elements (i.e. shape: 2)
then the result is a tensor of rank 2 with shape 2,2
i.e. the dimension of a tensor at all times must be
the number of nested tensors in it.
Also, all tensors must be "uniform" i.e. they must be accessed
uniformly, which means that all existing elements of a tensor
must be contiguous and have the same shape.
Implication of it all is that you can't put arbitrary
tensors inside tensors (like you would do to represent block matrices)
Rather, all tensors inside tensors must have same shape (and hence, rank)

Limitations
-----------
n.a.

Implementation info
-------------------
Tensors are implemented...

*/
// Called from the "eval" module to evaluate tensor elements.
export function Eval_tensor(p1: Tensor) {
  //U **a, **b
  //---------------------------------------------------------------------
  //
  //  create a new tensor for the result
  //
  //---------------------------------------------------------------------
  check_tensor_dimensions(p1);

  const { nelem } = p1.tensor;
  const { ndim } = p1.tensor;

  const p2 = alloc_tensor(nelem);

  p2.tensor.ndim = ndim;

  for (let i = 0; i < ndim; i++) {
    p2.tensor.dim[i] = p1.tensor.dim[i];
  }

  //---------------------------------------------------------------------
  //
  //  b = Eval(a)
  //
  //---------------------------------------------------------------------
  const a = p1.tensor.elem;
  const b = p2.tensor.elem;

  check_tensor_dimensions(p2);

  for (let i = 0; i < nelem; i++) {
    //console.log "push/pop: pushing element a of " + i
    push(a[i]);
    Eval();
    //console.log "push/pop: popping into element b of " + i
    b[i] = pop();
  }

  check_tensor_dimensions(p1);
  check_tensor_dimensions(p2);
  //---------------------------------------------------------------------
  //
  //  push the result
  //
  //---------------------------------------------------------------------
  push(p2);

  promote_tensor();
}

//-----------------------------------------------------------------------------
//
//  Add tensors
//
//  Input:    Operands on stack
//
//  Output:    Result on stack
//
//-----------------------------------------------------------------------------
export function tensor_plus_tensor() {
  const p2 = pop() as Tensor;
  const p1 = pop() as Tensor;

  // are the dimension lists equal?
  const { ndim } = p1.tensor;

  if (ndim !== p2.tensor.ndim) {
    push(symbol(NIL));
    return;
  }

  for (let i = 0; i < ndim; i++) {
    if (p1.tensor.dim[i] !== p2.tensor.dim[i]) {
      push(symbol(NIL));
      return;
    }
  }

  // create a new tensor for the result
  const { nelem } = p1.tensor;
  const p3 = alloc_tensor(nelem);
  p3.tensor.ndim = ndim;

  for (let i = 0; i < ndim; i++) {
    p3.tensor.dim[i] = p1.tensor.dim[i];
  }

  // c = a + b
  const a = p1.tensor.elem;
  const b = p2.tensor.elem;
  const c = p3.tensor.elem;

  for (let i = 0; i < nelem; i++) {
    push(a[i]);
    push(b[i]);
    add();
    c[i] = pop();
  }

  // push the result
  push(p3);
}

//-----------------------------------------------------------------------------
//
//  careful not to reorder factors
//
//-----------------------------------------------------------------------------
export function tensor_times_scalar() {
  const p2 = pop();
  const p1: U = pop() as Tensor;

  const { ndim } = p1.tensor;
  const { nelem } = p1.tensor;

  const p3: U = alloc_tensor(nelem);

  p3.tensor.ndim = ndim;

  for (let i = 0; i < ndim; i++) {
    p3.tensor.dim[i] = p1.tensor.dim[i];
  }

  const a = p1.tensor.elem;
  const b = p3.tensor.elem;

  for (let i = 0; i < nelem; i++) {
    push(a[i]);
    push(p2);
    multiply();
    b[i] = pop();
  }

  push(p3);
}

export function scalar_times_tensor() {
  const p2 = pop() as Tensor;
  const p1 = pop();

  const { ndim } = p2.tensor;
  const { nelem } = p2.tensor;

  const p3 = alloc_tensor(nelem);

  p3.tensor.ndim = ndim;

  for (let i = 0; i < ndim; i++) {
    p3.tensor.dim[i] = p2.tensor.dim[i];
  }

  const a = p2.tensor.elem;
  const b = p3.tensor.elem;

  for (let i = 0; i < nelem; i++) {
    push(p1);
    push(a[i]);
    multiply();
    b[i] = pop();
  }

  push(p3);
}

export function check_tensor_dimensions(p: Tensor<U>) {
  if (p.tensor.nelem !== p.tensor.elem.length) {
    console.log('something wrong in tensor dimensions');
    return debugger;
  }
}

function is_square_matrix(p: U): boolean {
  return (
    istensor(p) && p.tensor.ndim === 2 && p.tensor.dim[0] === p.tensor.dim[1]
  );
}

//-----------------------------------------------------------------------------
//
//  gradient of tensor
//
//-----------------------------------------------------------------------------
export function d_tensor_tensor(p1: Tensor, p2: Tensor) {
  //U **a, **b, **c

  let { ndim } = p1.tensor;
  let { nelem } = p1.tensor;

  if (ndim + 1 >= MAXDIM) {
    push_symbol(DERIVATIVE);
    push(p1);
    push(p2);
    list(3);
    return;
  }

  const p3 = alloc_tensor(nelem * p2.tensor.nelem);

  p3.tensor.ndim = ndim + 1;

  for (let i = 0; i < ndim; i++) {
    p3.tensor.dim[i] = p1.tensor.dim[i];
  }

  p3.tensor.dim[ndim] = p2.tensor.dim[0];

  const a = p1.tensor.elem;
  const b = p2.tensor.elem;
  const c = p3.tensor.elem;

  for (let i = 0; i < nelem; i++) {
    for (let j = 0; j < p2.tensor.nelem; j++) {
      push(a[i]);
      push(b[j]);
      derivative();
      c[i * p2.tensor.nelem + j] = pop();
    }
  }

  push(p3);
}

//-----------------------------------------------------------------------------
//
//  gradient of scalar
//
//-----------------------------------------------------------------------------
export function d_scalar_tensor(p1: U, p2: Tensor) {
  //U **a, **b

  const p3 = alloc_tensor(p2.tensor.nelem);

  p3.tensor.ndim = 1;

  p3.tensor.dim[0] = p2.tensor.dim[0];

  const a = p2.tensor.elem;
  const b = p3.tensor.elem;

  for (let i = 0; i < p2.tensor.nelem; i++) {
    push(p1);
    push(a[i]);
    derivative();
    b[i] = pop();
  }

  push(p3);
}

//-----------------------------------------------------------------------------
//
//  Derivative of tensor
//
//-----------------------------------------------------------------------------
export function d_tensor_scalar(p1: Tensor, p2: U) {
  //U **a, **b

  const p3 = alloc_tensor(p1.tensor.nelem);

  p3.tensor.ndim = p1.tensor.ndim;

  for (let i = 0; i < p1.tensor.ndim; i++) {
    p3.tensor.dim[i] = p1.tensor.dim[i];
  }

  const a = p1.tensor.elem;
  const b = p3.tensor.elem;

  for (let i = 0; i < p1.tensor.nelem; i++) {
    push(a[i]);
    push(p2);
    derivative();
    b[i] = pop();
  }

  push(p3);
}

export function compare_tensors(p1: Tensor<U>, p2: Tensor<U>): Sign {
  if (p1.tensor.ndim < p2.tensor.ndim) {
    return -1;
  }

  if (p1.tensor.ndim > p2.tensor.ndim) {
    return 1;
  }

  for (let i = 0; i < p1.tensor.ndim; i++) {
    if (p1.tensor.dim[i] < p2.tensor.dim[i]) {
      return -1;
    }
    if (p1.tensor.dim[i] > p2.tensor.dim[i]) {
      return 1;
    }
  }

  for (let i = 0; i < p1.tensor.nelem; i++) {
    if (equal(p1.tensor.elem[i], p2.tensor.elem[i])) {
      continue;
    }
    if (lessp(p1.tensor.elem[i], p2.tensor.elem[i])) {
      return -1;
    } else {
      return 1;
    }
  }

  return 0;
}

//-----------------------------------------------------------------------------
//
//  Raise a tensor to a power
//
//  Input:    p1  tensor
//
//      p2  exponent
//
//  Output:    Result on stack
//
//-----------------------------------------------------------------------------
export function power_tensor(p1: Tensor, p2: U) {
  // first and last dims must be equal
  let k = p1.tensor.ndim - 1;

  if (p1.tensor.dim[0] !== p1.tensor.dim[k]) {
    push_symbol(POWER);
    push(p1);
    push(p2);
    list(3);
    return;
  }

  push(p2);

  let n = pop_integer();

  if (isNaN(n)) {
    push_symbol(POWER);
    push(p1);
    push(p2);
    list(3);
    return;
  }

  if (n === 0) {
    if (p1.tensor.ndim !== 2) {
      stop('power(tensor,0) with tensor rank not equal to 2');
    }
    n = p1.tensor.dim[0];
    p1 = alloc_tensor(n * n);
    p1.tensor.ndim = 2;
    p1.tensor.dim[0] = n;
    p1.tensor.dim[1] = n;
    for (let i = 0; i < n; i++) {
      p1.tensor.elem[n * i + i] = defs.one;
    }

    check_tensor_dimensions(p1);

    push(p1);
    return;
  }

  if (n < 0) {
    n = -n;
    push(p1);
    inv();
    p1 = pop() as Tensor;
  }

  push(p1);

  for (let i = 1; i < n; i++) {
    push(p1);
    inner();
    if (isZeroAtomOrTensor(top())) {
      break;
    }
  }
}

export function copy_tensor(p1: Tensor): Tensor {
  let p2 = alloc_tensor(p1.tensor.nelem);

  p2.tensor.ndim = p1.tensor.ndim;

  for (let i = 0; i < p1.tensor.ndim; i++) {
    p2.tensor.dim[i] = p1.tensor.dim[i];
  }

  for (let i = 0; i < p1.tensor.nelem; i++) {
    p2.tensor.elem[i] = p1.tensor.elem[i];
  }

  check_tensor_dimensions(p1);
  check_tensor_dimensions(p2);

  return p2;
}

// Tensors with elements that are also tensors get promoted to a higher rank.
function promote_tensor() {
  const p1 = pop();

  if (!istensor(p1)) {
    push(p1);
    return;
  }

  let p2 = p1.tensor.elem[0];

  for (let i = 1; i < p1.tensor.nelem; i++) {
    if (!compatible(p2, p1.tensor.elem[i])) {
      stop('Cannot promote tensor due to inconsistent tensor components.');
    }
  }

  if (!istensor(p2)) {
    push(p1);
    return;
  }

  const ndim = p1.tensor.ndim + p2.tensor.ndim;
  if (ndim > MAXDIM) {
    stop('tensor rank > ' + MAXDIM);
  }

  const nelem = p1.tensor.nelem * p2.tensor.nelem;

  const p3 = alloc_tensor(nelem);

  p3.tensor.ndim = ndim;

  let i = 0;
  for (i = 0; i < p1.tensor.ndim; i++) {
    p3.tensor.dim[i] = p1.tensor.dim[i];
  }

  for (let j = 0; j < p2.tensor.ndim; j++) {
    p3.tensor.dim[i + j] = p2.tensor.dim[j];
  }

  let k = 0;
  for (let i = 0; i < p1.tensor.nelem; i++) {
    p2 = p1.tensor.elem[i] as Tensor;
    for (let j = 0; j < p2.tensor.nelem; j++) {
      p3.tensor.elem[k++] = p2.tensor.elem[j];
    }
  }

  check_tensor_dimensions(p2);
  check_tensor_dimensions(p3);

  push(p3);
}

function compatible(p, q): boolean {
  if (!istensor(p) && !istensor(q)) {
    return true;
  }

  if (!istensor(p) || !istensor(q)) {
    return false;
  }

  if (p.tensor.ndim !== q.tensor.ndim) {
    return false;
  }

  for (let i = 0; i < p.tensor.ndim; i++) {
    if (p.tensor.dim[i] !== q.tensor.dim[i]) {
      return false;
    }
  }

  return true;
}
