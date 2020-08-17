import { HILBERT, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { zero_matrix } from '../sources/misc';
import { pop_integer, push_integer } from './bignum';
import { list } from './list';
import { inverse } from './multiply';
//-----------------------------------------------------------------------------
//
//  Create a Hilbert matrix
//
//  Input:    Dimension on stack
//
//  Output:    Hilbert matrix on stack
//
//  Example:
//
//  > hilbert(5)
//  ((1,1/2,1/3,1/4),(1/2,1/3,1/4,1/5),(1/3,1/4,1/5,1/6),(1/4,1/5,1/6,1/7))
//
//-----------------------------------------------------------------------------
//define AELEM(i, j) A->u.tensor->elem[i * n + j]
export function hilbert() {
  const N: U = pop();
  push(N);
  const n = pop_integer();
  if (n < 2) {
    push_symbol(HILBERT);
    push(N);
    list(2);
    return;
  }
  const A: U = zero_matrix(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      push_integer(i + j + 1);
      inverse();
      A.tensor.elem[i * n + j] = pop();
    }
  }
  push(A);
}
