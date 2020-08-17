import { alloc_tensor } from '../runtime/alloc';
import {
  car,
  cdr,
  defs,
  INV,
  INVG,
  iscons,
  isidentitymatrix,
  isinnerordot,
  isinv,
  isNumericAtomOrTensor,
  istensor,
  Tensor,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { moveTos, pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { equal } from '../sources/misc';
import { subtract } from './add';
import { adj } from './adj';
import { det } from './det';
import { inner } from './inner';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
import { divide, multiply } from './multiply';
//-----------------------------------------------------------------------------
//
//  Input:    Matrix on stack (must have two dimensions but
//        it can be non-numerical)
//
//  Output:    Inverse on stack
//
//  Example:
//
//  > inv(((1,2),(3,4))
//  ((-2,1),(3/2,-1/2))
//
//  > inv(((a,b),(c,d))
//  ((d / (a d - b c),-b / (a d - b c)),(-c / (a d - b c),a / (a d - b c)))
//
//  Note:
//
//  THIS IS DIFFERENT FROM INVERSE OF AN EXPRESSION (inv)
//   Uses Gaussian elimination for numerical matrices.
//
//-----------------------------------------------------------------------------
function INV_check_arg(p1: U): p1 is Tensor & { ndim: 2 } {
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

export function inv() {
  let p1 = pop();

  // an inv just goes away when
  // applied to another inv
  if (isinv(p1)) {
    push(car(cdr(p1)));
    return;
  }

  // inverse goes away in case
  // of identity matrix
  if (isidentitymatrix(p1)) {
    push(p1);
    return;
  }

  // distribute the inverse of a dot
  // if in expanding mode
  // note that the distribution happens
  // in reverse.
  // The dot operator is not
  // commutative, so, it matters.
  if (defs.expanding && isinnerordot(p1)) {
    p1 = cdr(p1);
    const accumulator = [];
    while (iscons(p1)) {
      accumulator.push(car(p1));
      p1 = cdr(p1);
    }

    for (let eachEntry = accumulator.length - 1; eachEntry >= 0; eachEntry--) {
      push(accumulator[eachEntry]);
      inv();
      if (eachEntry !== accumulator.length - 1) {
        inner();
      }
    }

    return;
  }

  if (!INV_check_arg(p1)) {
    push_symbol(INV);
    push(p1);
    list(2);
    return;
  }

  if (isNumericAtomOrTensor(p1)) {
    yyinvg(p1);
  } else {
    push(p1);
    adj();
    push(p1);
    det();
    const p2 = pop();
    if (isZeroAtomOrTensor(p2)) {
      stop('inverse of singular matrix');
    }
    push(p2);
    divide();
  }
}

export function invg() {
  let p1: U;

  p1 = pop();

  if (!INV_check_arg(p1)) {
    push_symbol(INVG);
    push(p1);
    list(2);
    return;
  }

  yyinvg(p1);
}

// inverse using gaussian elimination
function yyinvg(p1: Tensor) {
  const n = p1.tensor.dim[0];
  const h = defs.tos;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        push(defs.one);
      } else {
        push(defs.zero);
      }
    }
  }

  for (let i = 0; i < n * n; i++) {
    push(p1.tensor.elem[i]);
  }

  INV_decomp(n);

  p1 = alloc_tensor(n * n);

  p1.tensor.ndim = 2;
  p1.tensor.dim[0] = n;
  p1.tensor.dim[1] = n;

  for (let i = 0; i < n * n; i++) {
    p1.tensor.elem[i] = defs.stack[h + i];
  }

  moveTos(defs.tos - 2 * n * n);

  push(p1);
}

//-----------------------------------------------------------------------------
//
//  Input:    n * n unit matrix on stack
//
//      n * n operand on stack
//
//  Output:    n * n inverse matrix on stack
//
//      n * n garbage on stack
//
//      p2 mangled
//
//-----------------------------------------------------------------------------

//define A(i, j) stack[a + n * (i) + (j)]
//define U(i, j) stack[u + n * (i) + (j)]
function INV_decomp(n: number) {
  const a = defs.tos - n * n;
  const u = a - n * n;

  for (let d = 0; d < n; d++) {
    if (equal(defs.stack[a + n * d + d], defs.zero)) {
      let i = 0;
      for (i = d + 1; i < n; i++) {
        if (!equal(defs.stack[a + n * i + d], defs.zero)) {
          break;
        }
      }

      if (i === n) {
        stop('inverse of singular matrix');
      }

      // exchange rows
      for (let j = 0; j < n; j++) {
        let p2 = defs.stack[a + n * d + j];
        defs.stack[a + n * d + j] = defs.stack[a + n * i + j];
        defs.stack[a + n * i + j] = p2;

        p2 = defs.stack[u + n * d + j];
        defs.stack[u + n * d + j] = defs.stack[u + n * i + j];
        defs.stack[u + n * i + j] = p2;
      }
    }

    // multiply the pivot row by 1 / pivot
    const p2 = defs.stack[a + n * d + d];

    for (let j = 0; j < n; j++) {
      if (j > d) {
        push(defs.stack[a + n * d + j]);
        push(p2);
        divide();
        defs.stack[a + n * d + j] = pop();
      }

      push(defs.stack[u + n * d + j]);
      push(p2);
      divide();
      defs.stack[u + n * d + j] = pop();
    }

    for (let i = 0; i < n; i++) {
      if (i === d) {
        continue;
      }

      // multiplier
      const p2 = defs.stack[a + n * i + d];

      for (let j = 0; j < n; j++) {
        if (j > d) {
          push(defs.stack[a + n * i + j]);
          push(defs.stack[a + n * d + j]);
          push(p2);
          multiply();
          subtract();
          defs.stack[a + n * i + j] = pop();
        }

        push(defs.stack[u + n * i + j]);
        push(defs.stack[u + n * d + j]);
        push(p2);
        multiply();
        subtract();
        defs.stack[u + n * i + j] = pop();
      }
    }
  }
}
