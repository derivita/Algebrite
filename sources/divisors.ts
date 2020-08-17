import { gcd } from './gcd';
import { alloc_tensor } from '../runtime/alloc';
import {
  ADD,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  iscons,
  isNumericAtom,
  MULTIPLY,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { moveTos, pop, push } from '../runtime/stack';
import { cmp_expr, sign } from '../sources/misc';
import { add } from './add';
import { pop_integer, push_integer } from './bignum';
import { factor_small_number } from './factor';
import { isplusone } from './is';
import { inverse, multiply } from './multiply';
import { power } from './power';
//-----------------------------------------------------------------------------
//
//  Generate all divisors of a term
//
//  Input:    Term on stack (factor * factor * ...)
//
//  Output:    Divisors on stack
//
//-----------------------------------------------------------------------------
export function divisors() {
  const h = defs.tos - 1;
  divisors_onstack();
  const n = defs.tos - h;

  //qsort(stack + h, n, sizeof (U *), __cmp)
  const subsetOfStack = defs.stack.slice(h, h + n);
  subsetOfStack.sort(cmp_expr);
  defs.stack = defs.stack
    .slice(0, h)
    .concat(subsetOfStack)
    .concat(defs.stack.slice(h + n));

  const p1: U = alloc_tensor(n);
  p1.tensor.ndim = 1;
  p1.tensor.dim[0] = n;
  for (let i = 0; i < n; i++) {
    p1.tensor.elem[i] = defs.stack[h + i];
  }
  moveTos(h);
  push(p1);
}

export function divisors_onstack() {
  let p2: U;
  let p1: U = pop();

  const h = defs.tos;

  // push all of the term's factors
  if (isNumericAtom(p1)) {
    push(p1);
    factor_small_number();
  } else if (car(p1) === symbol(ADD)) {
    push(p1);
    __factor_add();
    //printf(">>>\n")
    //for (i = h; i < tos; i++)
    //print(stdout, stack[i])
    //printf("<<<\n")
  } else if (car(p1) === symbol(MULTIPLY)) {
    p1 = cdr(p1);
    if (isNumericAtom(car(p1))) {
      push(car(p1));
      factor_small_number();
      p1 = cdr(p1);
    }
    while (iscons(p1)) {
      p2 = car(p1);
      if (car(p2) === symbol(POWER)) {
        push(cadr(p2));
        push(caddr(p2));
      } else {
        push(p2);
        push(defs.one);
      }
      p1 = cdr(p1);
    }
  } else if (car(p1) === symbol(POWER)) {
    push(cadr(p1));
    push(caddr(p1));
  } else {
    push(p1);
    push(defs.one);
  }

  const k = defs.tos;

  // contruct divisors by recursive descent
  push(defs.one);

  gen(h, k);

  // move
  const n = defs.tos - k;

  for (let i = 0; i < n; i++) {
    defs.stack[h + i] = defs.stack[k + i];
  }

  moveTos(h + n);
}

//-----------------------------------------------------------------------------
//
//  Generate divisors
//
//  Input:    Base-exponent pairs on stack
//
//      h  first pair
//
//      k  just past last pair
//
//  Output:    Divisors on stack
//
//  For example, factor list 2 2 3 1 results in 6 divisors,
//
//    1
//    3
//    2
//    6
//    4
//    12
//
//-----------------------------------------------------------------------------
function gen(h: number, k: number) {
  const ACCUM: U = pop();

  if (h === k) {
    push(ACCUM);
    return;
  }

  const BASE: U = defs.stack[h + 0];
  const EXPO: U = defs.stack[h + 1];

  push(EXPO);
  const expo = pop_integer();

  if (!isNaN(expo)) {
    for (let i = 0; i <= Math.abs(expo); i++) {
      push(ACCUM);
      push(BASE);
      push_integer(sign(expo) * i);
      power();
      multiply();
      gen(h + 2, k);
    }
  }
}

//-----------------------------------------------------------------------------
//
//  Factor ADD expression
//
//  Input:    Expression on stack
//
//  Output:    Factors on stack
//
//  Each factor consists of two expressions, the factor itself followed
//  by the exponent.
//
//-----------------------------------------------------------------------------
function __factor_add() {
  const p1 = pop();

  // get gcd of all terms
  let p3: U = cdr(p1);
  push(car(p3));
  p3 = cdr(p3);
  while (iscons(p3)) {
    push(car(p3));
    gcd();
    p3 = cdr(p3);
  }

  // check gcd
  let p2 = pop();
  if (isplusone(p2)) {
    push(p1);
    push(defs.one);
    return;
  }

  // push factored gcd
  if (isNumericAtom(p2)) {
    push(p2);
    factor_small_number();
  } else if (car(p2) === symbol(MULTIPLY)) {
    p3 = cdr(p2);
    if (isNumericAtom(car(p3))) {
      push(car(p3));
      factor_small_number();
    } else {
      push(car(p3));
      push(defs.one);
    }
    p3 = cdr(p3);
    while (iscons(p3)) {
      push(car(p3));
      push(defs.one);
      p3 = cdr(p3);
    }
  } else {
    push(p2);
    push(defs.one);
  }

  // divide each term by gcd
  push(p2);
  inverse();
  p2 = pop();

  push(defs.zero);
  p3 = cdr(p1);
  while (iscons(p3)) {
    push(p2);
    push(car(p3));
    multiply();
    add();
    p3 = cdr(p3);
  }

  push(defs.one);
}
