import { cadddr, caddr, cadr, istensor, Tensor, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { pop_integer } from './bignum';
import { determinant } from './det';
import { Eval } from './eval';
import { negate } from './multiply';
/* cofactor =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
m,i,j

General description
-------------------
Cofactor of a matrix component.
Let c be the cofactor matrix of matrix m, i.e. tranpose(c) = adj(m).
This function returns c[i,j].

*/
export function Eval_cofactor(p1: U) {
  push(cadr(p1));
  Eval();
  const p2 = pop();
  if (
    istensor(p2) &&
    p2.tensor.ndim === 2 &&
    p2.tensor.dim[0] === p2.tensor.dim[1]
  ) {
    // do nothing
  } else {
    stop('cofactor: 1st arg: square matrix expected');
  }
  const n = p2.tensor.dim[0];
  push(caddr(p1));
  Eval();
  const i = pop_integer();
  if (i < 1 || i > n) {
    stop('cofactor: 2nd arg: row index expected');
  }
  push(cadddr(p1));
  Eval();
  const j = pop_integer();
  if (j < 1 || j > n) {
    stop('cofactor: 3rd arg: column index expected');
  }
  cofactor(p2, n, i - 1, j - 1);
}

export function cofactor(p: Tensor<U>, n: number, row: number, col: number) {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== row && j !== col) {
        push(p.tensor.elem[n * i + j]);
      }
    }
  }
  determinant(n - 1);
  if ((row + col) % 2) {
    negate();
  }
}
