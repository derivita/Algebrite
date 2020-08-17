import { alloc_tensor } from '../runtime/alloc';
import {
  cadddr,
  caddr,
  cadr,
  car,
  cddr,
  cdr,
  defs,
  isadd,
  iscons,
  isidentitymatrix,
  isinnerordot,
  ismultiply,
  isNumericAtom,
  istensor,
  istranspose,
  MAXDIM,
  NIL,
  symbol,
  TRANSPOSE,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { equal } from '../sources/misc';
import { add } from './add';
import { pop_integer, push_integer } from './bignum';
import { Eval } from './eval';
import { inner } from './inner';
import { isplusone, isplustwo, isZeroAtomOrTensor } from './is';
import { list } from './list';
import { multiply } from './multiply';
// Transpose tensor indices
export function Eval_transpose(p1: U) {
  push(cadr(p1));
  Eval();

  // add default params if they
  // have not been passed
  if (cddr(p1) === symbol(NIL)) {
    push_integer(1);
    push_integer(2);
  } else {
    push(caddr(p1));
    Eval();
    push(cadddr(p1));
    Eval();
  }
  transpose();
}

export function transpose() {
  let t = 0;
  const ai: number[] = [];
  const an: number[] = [];
  for (let i = 0; i < MAXDIM; i++) {
    ai[i] = 0;
    an[i] = 0;
  }

  // by default p3 is 2 and p2 is 1
  const p3 = pop(); // index to be transposed
  let p2 = pop(); // other index to be transposed
  let p1 = pop(); // what needs to be transposed

  // a transposition just goes away when
  // applied to a scalar
  if (isNumericAtom(p1)) {
    push(p1);
    return;
  }

  // transposition goes away for identity matrix
  if ((isplusone(p2) && isplustwo(p3)) || (isplusone(p3) && isplustwo(p2))) {
    if (isidentitymatrix(p1)) {
      push(p1);
      return;
    }
  }

  // a transposition just goes away when
  // applied to another transposition with
  // the same columns to be switched
  if (istranspose(p1)) {
    const innerTranspSwitch1 = car(cdr(cdr(p1)));
    const innerTranspSwitch2 = car(cdr(cdr(cdr(p1))));

    if (
      (equal(innerTranspSwitch1, p3) && equal(innerTranspSwitch2, p2)) ||
      (equal(innerTranspSwitch2, p3) && equal(innerTranspSwitch1, p2)) ||
      (equal(innerTranspSwitch1, symbol(NIL)) &&
        equal(innerTranspSwitch2, symbol(NIL)) &&
        ((isplusone(p3) && isplustwo(p2)) || (isplusone(p2) && isplustwo(p3))))
    ) {
      push(car(cdr(p1)));
      return;
    }
  }

  // if operand is a sum then distribute
  // (if we are in expanding mode)
  if (defs.expanding && isadd(p1)) {
    p1 = cdr(p1);
    push(defs.zero);
    while (iscons(p1)) {
      push(car(p1));
      // add the dimensions to switch but only if
      // they are not the default ones.
      push(p2);
      push(p3);
      transpose();
      add();
      p1 = cdr(p1);
    }
    return;
  }

  // if operand is a multiplication then distribute
  // (if we are in expanding mode)
  if (defs.expanding && ismultiply(p1)) {
    p1 = cdr(p1);
    push(defs.one);
    while (iscons(p1)) {
      push(car(p1));
      // add the dimensions to switch but only if
      // they are not the default ones.
      push(p2);
      push(p3);
      transpose();
      multiply();
      p1 = cdr(p1);
    }
    return;
  }

  // distribute the transpose of a dot
  // if in expanding mode
  // note that the distribution happens
  // in reverse as per tranpose rules.
  // The dot operator is not
  // commutative, so, it matters.
  if (defs.expanding && isinnerordot(p1)) {
    p1 = cdr(p1);
    const accumulator = [];
    while (iscons(p1)) {
      accumulator.push([car(p1), p2, p3]);
      p1 = cdr(p1);
    }

    for (let eachEntry = accumulator.length - 1; eachEntry >= 0; eachEntry--) {
      push(accumulator[eachEntry][0]);
      push(accumulator[eachEntry][1]);
      push(accumulator[eachEntry][2]);
      transpose();
      if (eachEntry !== accumulator.length - 1) {
        inner();
      }
    }

    return;
  }

  if (!istensor(p1)) {
    if (!isZeroAtomOrTensor(p1)) {
      //stop("transpose: tensor expected, 1st arg is not a tensor")
      push_symbol(TRANSPOSE);
      push(p1);
      // remove the default "dimensions to be switched"
      // parameters
      if (
        (!isplusone(p2) || !isplustwo(p3)) &&
        (!isplusone(p3) || !isplustwo(p2))
      ) {
        push(p2);
        push(p3);
        list(4);
      } else {
        list(2);
      }
      return;
    }
    push(defs.zero);
    return;
  }

  const { ndim } = p1.tensor;
  const { nelem } = p1.tensor;

  // is it a vector?
  // so here it's something curious - note how vectors are
  // not really special two-dimensional matrices, but rather
  // 1-dimension objects (like tensors can be). So since
  // they have one dimension, transposition has no effect.
  // (as opposed as if they were special two-dimensional
  // matrices)
  // see also Ran Pan, Tensor Transpose and Its Properties. CoRR abs/1411.1503 (2014)
  if (ndim === 1) {
    push(p1);
    return;
  }

  push(p2);
  let l = pop_integer();

  push(p3);
  let m = pop_integer();

  if (l < 1 || l > ndim || m < 1 || m > ndim) {
    stop('transpose: index out of range');
  }

  l--;
  m--;

  p2 = alloc_tensor(nelem);

  p2.tensor.ndim = ndim;

  for (let i = 0; i < ndim; i++) {
    p2.tensor.dim[i] = p1.tensor.dim[i];
  }

  p2.tensor.dim[l] = p1.tensor.dim[m];
  p2.tensor.dim[m] = p1.tensor.dim[l];

  const a = p1.tensor.elem;
  const b = p2.tensor.elem;

  // init tensor index
  for (let i = 0; i < ndim; i++) {
    ai[i] = 0;
    an[i] = p1.tensor.dim[i];
  }

  // copy components from a to b
  for (let i = 0; i < nelem; i++) {
    t = ai[l];
    ai[l] = ai[m];
    ai[m] = t;
    t = an[l];
    an[l] = an[m];
    an[m] = t;

    // convert tensor index to linear index k
    let k = 0;
    for (let j = 0; j < ndim; j++) {
      k = k * an[j] + ai[j];
    }

    // swap indices back
    t = ai[l];
    ai[l] = ai[m];
    ai[m] = t;
    t = an[l];
    an[l] = an[m];
    an[m] = t;

    // copy one element
    b[k] = a[i];

    // increment tensor index
    // Suppose the tensor dimensions are 2 and 3.
    // Then the tensor index ai increments as follows:
    // 00 -> 01
    // 01 -> 02
    // 02 -> 10
    // 10 -> 11
    // 11 -> 12
    // 12 -> 00

    for (let j = ndim - 1; j >= 0; j--) {
      if (++ai[j] < an[j]) {
        break;
      }
      ai[j] = 0;
    }
  }

  push(p2);
}
