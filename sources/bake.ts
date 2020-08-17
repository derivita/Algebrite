import {
  ADD,
  car,
  cdr,
  defs,
  FOR,
  iscons,
  MULTIPLY,
  POWER,
  symbol,
  SYMBOL_S,
  SYMBOL_T,
  SYMBOL_X,
  SYMBOL_Y,
  SYMBOL_Z,
  U,
} from '../runtime/defs';
import { moveTos, pop, push, swap } from '../runtime/stack';
import { push_integer } from './bignum';
import { coeff } from './coeff';
import { cons } from './cons';
import { equaln, ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { list } from './list';
// pretty print

export function bake() {
  defs.expanding++;

  let p1: U = pop();

  const s = ispolyexpandedform(p1, symbol(SYMBOL_S));
  const t = ispolyexpandedform(p1, symbol(SYMBOL_T));
  const x = ispolyexpandedform(p1, symbol(SYMBOL_X));
  const y = ispolyexpandedform(p1, symbol(SYMBOL_Y));
  const z = ispolyexpandedform(p1, symbol(SYMBOL_Z));

  if (s && !t && !x && !y && !z) {
    const p2: U = symbol(SYMBOL_S);
    bake_poly(p1, p2);
  } else if (!s && t && !x && !y && !z) {
    const p2: U = symbol(SYMBOL_T);
    bake_poly(p1, p2);
  } else if (!s && !t && x && !y && !z) {
    const p2: U = symbol(SYMBOL_X);
    bake_poly(p1, p2);
  } else if (!s && !t && !x && y && !z) {
    const p2: U = symbol(SYMBOL_Y);
    bake_poly(p1, p2);
  } else if (!s && !t && !x && !y && z) {
    const p2: U = symbol(SYMBOL_Z);
    bake_poly(p1, p2);
    // don't bake the contents of some constructs such as "for"
    // because we don't want to evaluate the body of
    // such constructs "statically", i.e. without fully running
    // the loops.
  } else if (iscons(p1) && car(p1) !== symbol(FOR)) {
    const h = defs.tos;
    push(car(p1));
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      bake();
      p1 = cdr(p1);
    }
    list(defs.tos - h);
  } else {
    push(p1);
  }

  defs.expanding--;
}

export function polyform() {
  let p2: U = pop();
  let p1: U = pop();

  if (ispolyexpandedform(p1, p2)) {
    bake_poly(p1, p2);
  } else if (iscons(p1)) {
    const h = defs.tos;
    push(car(p1));
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      push(p2);
      polyform();
      p1 = cdr(p1);
    }
    list(defs.tos - h);
  } else {
    push(p1);
  }
}

function bake_poly(poly: U, x: U) {
  //U **a
  const a = defs.tos;
  push(poly); // p(x)
  push(x); // x
  const k = coeff();
  const h = defs.tos;
  for (let i = k - 1; i >= 0; i--) {
    const term = defs.stack[a + i];
    bake_poly_term(i, term, x);
  }
  const n = defs.tos - h;
  if (n > 1) {
    list(n);
    push(symbol(ADD));
    swap();
    cons();
  }
  const result = pop();
  moveTos(defs.tos - k);
  push(result);
}

// p1 points to coefficient of p2 ^ k

// k is an int
function bake_poly_term(k: number, coefficient: U, term: U) {
  if (isZeroAtomOrTensor(coefficient)) {
    return;
  }

  // constant term?
  if (k === 0) {
    if (car(coefficient) === symbol(ADD)) {
      coefficient = cdr(coefficient);
      while (iscons(coefficient)) {
        push(car(coefficient));
        coefficient = cdr(coefficient);
      }
    } else {
      push(coefficient);
    }
    return;
  }

  const h = defs.tos;

  // coefficient
  if (car(coefficient) === symbol(MULTIPLY)) {
    coefficient = cdr(coefficient);
    while (iscons(coefficient)) {
      push(car(coefficient));
      coefficient = cdr(coefficient);
    }
  } else if (!equaln(coefficient, 1)) {
    push(coefficient);
  }

  // x ^ k
  if (k === 1) {
    push(term);
  } else {
    push(symbol(POWER));
    push(term);
    push_integer(k);
    list(3);
  }

  const n = defs.tos - h;

  if (n > 1) {
    list(n);
    push(symbol(MULTIPLY));
    swap();
    cons();
  }
}
