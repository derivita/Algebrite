import { alloc_tensor } from '../runtime/alloc';
import { cadr, istensor, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { cofactor } from './cofactor';
import { Eval } from './eval';
/* adj =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
m

General description
-------------------
Returns the adjunct of matrix m. The inverse of m is equal to adj(m) divided by det(m).

*/
export function Eval_adj(p1: U) {
  push(cadr(p1));
  Eval();
  adj();
}

export function adj() {
  const p1 = pop();

  if (
    istensor(p1) &&
    p1.tensor.ndim === 2 &&
    p1.tensor.dim[0] === p1.tensor.dim[1]
  ) {
    // do nothing
  } else {
    stop('adj: square matrix expected');
  }

  const n = p1.tensor.dim[0];

  const p2 = alloc_tensor(n * n);

  p2.tensor.ndim = 2;
  p2.tensor.dim[0] = n;
  p2.tensor.dim[1] = n;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cofactor(p1, n, i, j);
      p2.tensor.elem[n * j + i] = pop();
    }
  } // transpose

  push(p2);
}
