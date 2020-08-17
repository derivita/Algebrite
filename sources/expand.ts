import { alloc_tensor } from '../runtime/alloc';
import {
  ADD,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  iscons,
  istensor,
  MULTIPLY,
  NIL,
  POWER,
  symbol,
  Tensor,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { moveTos, pop, push } from '../runtime/stack';
import { equal } from '../sources/misc';
import { add, subtract } from './add';
import { pop_integer, push_integer } from './bignum';
import { degree } from './degree';
import { denominator } from './denominator';
import { Eval } from './eval';
import { factorpoly } from './factorpoly';
import { factors } from './factors';
import { filter } from './filter';
import { guess } from './guess';
import { inner } from './inner';
import { inv } from './inv';
import { isone, ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { divide, multiply, multiply_all, reciprocate } from './multiply';
import { numerator } from './numerator';
import { power } from './power';
import { divpoly } from './quotient';
import { copy_tensor } from './tensor';
// Partial fraction expansion
//
// Example
//
//      expand(1/(x^3+x^2),x)
//
//        1      1       1
//      ---- - --- + -------
//        2     x     x + 1
//       x
export function Eval_expand(p1: U) {
  // 1st arg
  push(cadr(p1));
  Eval();

  // 2nd arg
  push(caddr(p1));
  Eval();

  const p2 = pop();
  if (p2 === symbol(NIL)) {
    guess();
  } else {
    push(p2);
  }

  expand();
}

//define A p2
//define B p3
//define C p4
//define F p5
//define P p6
//define Q p7
//define T p8
//define X p9

function expand() {
  let p1: U;
  let prev_expanding;

  const X = pop();
  const F = pop();

  if (istensor(F)) {
    expand_tensor(F, X);
    return;
  }

  // if sum of terms then sum over the expansion of each term
  if (car(F) === symbol(ADD)) {
    push_integer(0);
    p1 = cdr(F);
    while (iscons(p1)) {
      push(car(p1));
      push(X);
      expand();
      add();
      p1 = cdr(p1);
    }
    return;
  }

  // B = numerator
  push(F);
  numerator();
  let B = pop();

  // A = denominator
  push(F);
  denominator();
  let A = pop();

  [A, B] = remove_negative_exponents(A, B, X);

  // Q = quotient
  push(B);
  push(A);
  push(X);

  // if the denominator is one then always bail out
  // also bail out if the denominator is not one but
  // it's not anything recognizable as a polynomial.
  if (isone(B) || isone(A)) {
    if (!ispolyexpandedform(A, X) || isone(A)) {
      pop();
      pop();
      pop();
      push(F);
      return;
    }
  }

  divpoly();
  const Q = pop();

  // remainder B = B - A * Q
  push(B);
  push(A);
  push(Q);
  multiply();
  subtract();
  B = pop();

  // if the remainder is zero then we're done
  if (isZeroAtomOrTensor(B)) {
    push(Q);
    return;
  }

  // A = factor(A)
  //console.log("expand - to be factored: " + p2)
  push(A);
  push(X);
  factorpoly();
  A = pop();
  //console.log("expand - factored to: " + p2)

  let [C] = expand_get_C(A, X);
  [B] = expand_get_B(B, C, X);
  [A] = expand_get_A(A, C, X);

  if (istensor(C)) {
    push(C);
    prev_expanding = defs.expanding;
    defs.expanding = 1;
    inv();
    defs.expanding = prev_expanding;
    push(B);
    inner();
    push(A);
    inner();
  } else {
    push(B);
    push(C);
    prev_expanding = defs.expanding;
    defs.expanding = 1;
    divide();
    defs.expanding = prev_expanding;
    push(A);
    multiply();
  }

  push(Q);
  add();
}

function expand_tensor(p5: Tensor, p9: U) {
  p5 = copy_tensor(p5);
  for (let i = 0; i < p5.tensor.nelem; i++) {
    push(p5.tensor.elem[i]);
    push(p9);
    expand();
    p5.tensor.elem[i] = pop();
  }
  push(p5);
}

function remove_negative_exponents(p2: U, p3: U, p9: U): [U, U] {
  const h = defs.tos;
  factors(p2);
  factors(p3);
  const n = defs.tos - h;

  // find the smallest exponent
  let j = 0;
  for (let i = 0; i < n; i++) {
    const p1 = defs.stack[h + i];
    if (car(p1) !== symbol(POWER)) {
      continue;
    }
    if (cadr(p1) !== p9) {
      continue;
    }
    push(caddr(p1));
    const k = pop_integer();
    if (isNaN(k)) {
      continue;
    }
    if (k < j) {
      j = k;
    }
  }

  moveTos(h);

  if (j === 0) {
    return [p2, p3];
  }

  // A = A / X^j
  push(p2);
  push(p9);
  push_integer(-j);
  power();
  multiply();
  p2 = pop();

  // B = B / X^j
  push(p3);
  push(p9);
  push_integer(-j);
  power();
  multiply();
  p3 = pop();
  return [p2, p3];
}

// Returns the expansion coefficient matrix C.
//
// Example:
//
//       B         1
//      --- = -----------
//       A      2
//             x (x + 1)
//
// We have
//
//       B     Y1     Y2      Y3
//      --- = ---- + ---- + -------
//       A      2     x      x + 1
//             x
//
// Our task is to solve for the unknowns Y1, Y2, and Y3.
//
// Multiplying both sides by A yields
//
//           AY1     AY2      AY3
//      B = ----- + ----- + -------
//            2      x       x + 1
//           x
//
// Let
//
//            A               A                 A
//      W1 = ----       W2 = ---        W3 = -------
//             2              x               x + 1
//            x
//
// Then the coefficient matrix C is
//
//              coeff(W1,x,0)   coeff(W2,x,0)   coeff(W3,x,0)
//
//       C =    coeff(W1,x,1)   coeff(W2,x,1)   coeff(W3,x,1)
//
//              coeff(W1,x,2)   coeff(W2,x,2)   coeff(W3,x,2)
//
// It follows that
//
//       coeff(B,x,0)     Y1
//
//       coeff(B,x,1) = C Y2
//
//       coeff(B,x,2) =   Y3
//
// Hence
//
//       Y1       coeff(B,x,0)
//             -1
//       Y2 = C   coeff(B,x,1)
//
//       Y3       coeff(B,x,2)
function expand_get_C(p2: U, p9: U): [U] {
  //U **a
  const h = defs.tos;
  if (car(p2) === symbol(MULTIPLY)) {
    let p1 = cdr(p2);
    while (iscons(p1)) {
      const p5 = car(p1);
      expand_get_CF(p2, p5, p9);
      p1 = cdr(p1);
    }
  } else {
    const p5 = p2;
    expand_get_CF(p2, p5, p9);
  }
  const n = defs.tos - h;
  if (n === 1) {
    const p4 = pop();
    return [p4];
  }
  const p4 = alloc_tensor(n * n);
  p4.tensor.ndim = 2;
  p4.tensor.dim[0] = n;
  p4.tensor.dim[1] = n;
  const a = h;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      push(defs.stack[a + j]);
      push(p9);
      push_integer(i);
      power();
      const prev_expanding = defs.expanding;
      defs.expanding = 1;
      divide();
      defs.expanding = prev_expanding;
      push(p9);
      filter();
      p4.tensor.elem[n * i + j] = pop();
    }
  }
  moveTos(defs.tos - n);
  return [p4];
}

// The following table shows the push order for simple roots, repeated roots,
// and inrreducible factors.
//
//  Factor F        Push 1st        Push 2nd         Push 3rd      Push 4th
//
//
//                   A
//  x               ---
//                   x
//
//
//   2               A               A
//  x               ----            ---
//                    2              x
//                   x
//
//
//                     A
//  x + 1           -------
//                   x + 1
//
//
//         2            A              A
//  (x + 1)         ----------      -------
//                          2        x + 1
//                   (x + 1)
//
//
//   2                   A               Ax
//  x  + x + 1      ------------    ------------
//                    2               2
//                   x  + x + 1      x  + x + 1
//
//
//    2         2          A              Ax              A             Ax
//  (x  + x + 1)    --------------- ---------------  ------------  ------------
//                     2         2     2         2     2             2
//                   (x  + x + 1)    (x  + x + 1)     x  + x + 1    x  + x + 1
//
//
// For T = A/F and F = P^N we have
//
//
//      Factor F          Push 1st    Push 2nd    Push 3rd    Push 4th
//
//      x                 T
//
//       2
//      x                 T           TP
//
//
//      x + 1             T
//
//             2
//      (x + 1)           T           TP
//
//       2
//      x  + x + 1        T           TX
//
//        2         2
//      (x  + x + 1)      T           TX          TP          TPX
//
//
// Hence we want to push in the order
//
//      T * (P ^ i) * (X ^ j)
//
// for all i, j such that
//
//      i = 0, 1, ..., N - 1
//
//      j = 0, 1, ..., deg(P) - 1
//
// where index j runs first.
function expand_get_CF(p2: U, p5: U, p9: U) {
  let p6: U;
  let n = 0;

  if (!Find(p5, p9)) {
    return;
  }
  let prev_expanding = defs.expanding;
  defs.expanding = 1;
  const [p8] = trivial_divide(p2, p5);
  defs.expanding = prev_expanding;
  if (car(p5) === symbol(POWER)) {
    push(caddr(p5));
    n = pop_integer();
    p6 = cadr(p5);
  } else {
    n = 1;
    p6 = p5;
  }

  push(p6);
  push(p9);
  degree();
  const d = pop_integer();

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      push(p8);
      push(p6);
      push_integer(i);
      power();
      prev_expanding = defs.expanding;
      defs.expanding = 1;
      multiply();
      defs.expanding = prev_expanding;
      push(p9);
      push_integer(j);
      power();
      prev_expanding = defs.expanding;
      defs.expanding = 1;
      multiply();
      defs.expanding = prev_expanding;
    }
  }
}

// Returns T = A/F where F is a factor of A.
function trivial_divide(p2: U, p5: U): [U] {
  if (car(p2) === symbol(MULTIPLY)) {
    const h = defs.tos;
    let p0 = cdr(p2);
    while (iscons(p0)) {
      if (!equal(car(p0), p5)) {
        push(car(p0));
        Eval(); // force expansion of (x+1)^2, f.e.
      }
      p0 = cdr(p0);
    }
    multiply_all(defs.tos - h);
  } else {
    push_integer(1);
  }
  const p8 = pop();
  return [p8];
}

// Returns the expansion coefficient vector B.
function expand_get_B(p3: U, p4: U, p9: U): [U] {
  if (!istensor(p4)) {
    return [p3];
  }
  const n = p4.tensor.dim[0];
  const p8 = alloc_tensor(n);
  p8.tensor.ndim = 1;
  p8.tensor.dim[0] = n;
  for (let i = 0; i < n; i++) {
    push(p3);
    push(p9);
    push_integer(i);
    power();
    const prev_expanding = defs.expanding;
    defs.expanding = 1;
    divide();
    defs.expanding = prev_expanding;
    push(p9);
    filter();
    p8.tensor.elem[i] = pop();
  }
  p3 = p8;
  return [p3];
}

// Returns the expansion fractions in A.
function expand_get_A(p2: U, p4: U, p9: U): [U] {
  if (!istensor(p4)) {
    push(p2);
    reciprocate();
    p2 = pop();
    return [p2];
  }
  const h = defs.tos;
  if (car(p2) === symbol(MULTIPLY)) {
    let p8 = cdr(p2);
    while (iscons(p8)) {
      const p5 = car(p8);
      expand_get_AF(p5, p9);
      p8 = cdr(p8);
    }
  } else {
    const p5 = p2;
    expand_get_AF(p5, p9);
  }
  const n = defs.tos - h;
  const p8 = alloc_tensor(n);
  p8.tensor.ndim = 1;
  p8.tensor.dim[0] = n;
  for (let i = 0; i < n; i++) {
    p8.tensor.elem[i] = defs.stack[h + i];
  }
  moveTos(h);
  p2 = p8;
  return [p2];
}

function expand_get_AF(p5: U, p9: U) {
  let n = 1;
  if (!Find(p5, p9)) {
    return;
  }
  if (car(p5) === symbol(POWER)) {
    push(caddr(p5));
    n = pop_integer();
    p5 = cadr(p5);
  }
  push(p5);
  push(p9);
  degree();
  const d = pop_integer();

  for (let i = n; i > 0; i--) {
    for (let j = 0; j < d; j++) {
      push(p5);
      push_integer(i);
      power();
      reciprocate();
      push(p9);
      push_integer(j);
      power();
      multiply();
    }
  }
}
