import {
  defs,
  DET,
  isNumericAtom,
  istensor,
  Sign,
  Tensor,
  U,
} from '../runtime/defs';
import { moveTos, pop, push, top } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { equal } from '../sources/misc';
import { add } from './add';
import { push_integer } from './bignum';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
/* det =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
m

General description
-------------------
Returns the determinant of matrix m.
Uses Gaussian elimination for numerical matrices.

Example:

  det(((1,2),(3,4)))
  > -2

*/
function DET_check_arg(p1: U): boolean {
  if (!istensor(p1)) {
    return false;
  } else if (p1.tensor.ndim !== 2) {
    return false;
  } else if (p1.tensor.dim[0] !== p1.tensor.dim[1]) {
    return false;
  } else {
    return true;
  }
}

export function det() {
  let i = 0;

  const p1: U = pop() as Tensor;

  if (!DET_check_arg(p1)) {
    push_symbol(DET);
    push(p1);
    list(2);
    return;
  }

  const n = p1.tensor.nelem;

  const a = p1.tensor.elem;

  for (i = 0; i < n; i++) {
    if (!isNumericAtom(a[i])) {
      break;
    }
  }

  if (i === n) {
    yydetg(p1);
  } else {
    for (i = 0; i < p1.tensor.nelem; i++) {
      push(p1.tensor.elem[i]);
    }
    determinant(p1.tensor.dim[0]);
  }
}

// determinant of n * n matrix elements on the stack
export function determinant(n: number) {
  let q = 0;

  const a: number[] = [];
  //int *a, *c, *d

  const h = defs.tos - n * n;

  //a = (int *) malloc(3 * n * sizeof (int))

  //if (a == NULL)
  //  out_of_memory()

  for (let i = 0; i < n; i++) {
    a[i] = i;
    a[i + n] = 0;
    a[i + n + n] = 1;
  }

  let sign_: Sign = 1;

  push(defs.zero);

  while (true) {
    if (sign_ === 1) {
      push_integer(1);
    } else {
      push_integer(-1);
    }

    for (let i = 0; i < n; i++) {
      const k = n * a[i] + i;
      push(defs.stack[h + k]);
      multiply();
    } // FIXME -- problem here

    add();

    // next permutation (Knuth's algorithm P)

    let j = n - 1;
    let s = 0;

    let breakFromOutherWhile = false;
    while (true) {
      q = a[n + j] + a[n + n + j];
      if (q < 0) {
        a[n + n + j] = -a[n + n + j];
        j--;
        continue;
      }
      if (q === j + 1) {
        if (j === 0) {
          breakFromOutherWhile = true;
          break;
        }
        s++;
        a[n + n + j] = -a[n + n + j];
        j--;
        continue;
      }
      break;
    }

    if (breakFromOutherWhile) {
      break;
    }

    const t = a[j - a[n + j] + s];
    a[j - a[n + j] + s] = a[j - q + s];
    a[j - q + s] = t;
    a[n + j] = q;

    sign_ = sign_ === 1 ? -1 : 1;
  }

  defs.stack[h] = top();

  moveTos(h + 1);
}

//-----------------------------------------------------------------------------
//
//  Input:    Matrix on stack
//
//  Output:    Determinant on stack
//
//  Note:
//
//  Uses Gaussian elimination which is faster for numerical matrices.
//
//  Gaussian Elimination works by walking down the diagonal and clearing
//  out the columns below it.
//
//-----------------------------------------------------------------------------

function detg() {
  const p1 = pop() as Tensor;

  if (!DET_check_arg(p1)) {
    push_symbol(DET);
    push(p1);
    list(2);
    return;
  }

  yydetg(p1);

  return;
}

function yydetg(p1: Tensor) {
  const n = p1.tensor.dim[0];

  for (let i = 0; i < n * n; i++) {
    push(p1.tensor.elem[i]);
  }

  const decomp = lu_decomp(n);

  moveTos(defs.tos - n * n);

  push(decomp);
}

//-----------------------------------------------------------------------------
//
//  Input:    n * n matrix elements on stack
//
//  Output:    p1  determinant
//
//      p2  mangled
//
//      upper diagonal matrix on stack
//
//-----------------------------------------------------------------------------
function M(h: number, n: number, i: number, j: number): U {
  return defs.stack[h + n * i + j];
}

function setM(h: number, n: number, i: number, j: number, value: U) {
  defs.stack[h + n * i + j] = value;
}

function lu_decomp(n: number): [U] {
  const h = defs.tos - n * n;

  let p1: U = defs.one;

  for (let d = 0; d < n - 1; d++) {
    if (equal(M(h, n, d, d), defs.zero)) {
      let i = 0;
      for (i = d + 1; i < n; i++) {
        if (!equal(M(h, n, i, d), defs.zero)) {
          break;
        }
      }

      if (i === n) {
        p1 = defs.zero;
        break;
      }

      // exchange rows
      for (let j = d; j < n; j++) {
        const p2 = M(h, n, d, j);
        setM(h, n, d, j, M(h, n, i, j));
        setM(h, n, i, j, p2);
      }

      // negate det
      push(p1);
      negate();
      p1 = pop();
    }

    // update det
    push(p1);
    push(M(h, n, d, d));
    multiply();
    p1 = pop();

    // update lower diagonal matrix
    for (let i = d + 1; i < n; i++) {
      push(M(h, n, i, d));
      push(M(h, n, d, d));
      divide();
      negate();

      const p2 = pop();

      // update one row
      setM(h, n, i, d, defs.zero); // clear column below pivot d

      for (let j = d + 1; j < n; j++) {
        push(M(h, n, d, j));
        push(p2);
        multiply();
        push(M(h, n, i, j));
        add();
        setM(h, n, i, j, pop());
      }
    }
  }

  // last diagonal element
  push(p1);
  push(M(h, n, n - 1, n - 1));
  multiply();
  p1 = pop();
  return [p1];
}
