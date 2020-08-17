import {
  caar,
  caddr,
  cadr,
  car,
  cdar,
  cdddr,
  cddr,
  cdr,
  defs,
  dontCreateNewRadicalsInDenominatorWhenEvalingMultiplication,
  isadd,
  iscons,
  isdouble,
  isNumericAtom,
  isrational,
  istensor,
  MULTIPLY,
  NIL,
  OPERATOR,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { moveTos, pop, push, top } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { cmp_expr } from '../sources/misc';
import { add, subtract } from './add';
import {
  divide_numbers,
  invert_number,
  mp_denominator,
  mp_numerator,
  multiply_numbers,
  negate_number,
  push_double,
  push_integer,
} from './bignum';
import { cons } from './cons';
import { Eval } from './eval';
import {
  equaln,
  isinteger,
  isminusone,
  isnegativenumber,
  isplusone,
  isZeroAtom,
} from './is';
import { list } from './list';
import { power } from './power';
import { scalar_times_tensor, tensor_times_scalar } from './tensor';
import { append } from '../runtime/otherCFunctions';
// Symbolic multiplication

// multiplication is commutative, so it can't be used
// e.g. on two matrices.
// But it can be used, say, on a scalar and a matrix.,
// so the output of a multiplication is not
// always a scalar.

//extern void append(void)
//static void parse_p1(void)
//static void parse_p2(void)
//static void __normalize_radical_factors(int)
export function Eval_multiply(p1: U) {
  push(cadr(p1));
  Eval();
  p1 = cddr(p1);

  while (iscons(p1)) {
    push(car(p1));
    Eval();
    multiply();
    p1 = cdr(p1);
  }
}

// this one doesn't eval the factors,
// so you pass i*(-1)^(1/2), it wouldnt't
// give -1, because i is not evalled
export function multiply() {
  if (defs.esc_flag) {
    stop('escape key stop');
  }
  if (isNumericAtom(defs.stack[defs.tos - 2]) && isNumericAtom(top())) {
    return multiply_numbers();
  } else {
    yymultiply();
    return;
  }
}

function yymultiply() {
  // pop operands
  let p2: U = pop();
  let p1: U = pop();

  const h = defs.tos;

  // is either operand zero?
  if (isZeroAtom(p1) || isZeroAtom(p2)) {
    if (defs.evaluatingAsFloats) {
      push_double(0.0);
    } else {
      push(defs.zero);
    }
    return;
  }

  // is either operand a sum?
  //console.log("yymultiply: expanding: " + expanding)
  if (defs.expanding && isadd(p1)) {
    p1 = cdr(p1);
    if (defs.evaluatingAsFloats) {
      push_double(0.0);
    } else {
      push(defs.zero);
    }
    while (iscons(p1)) {
      push(car(p1));
      push(p2);
      multiply();
      add();
      p1 = cdr(p1);
    }
    return;
  }

  if (defs.expanding && isadd(p2)) {
    p2 = cdr(p2);
    if (defs.evaluatingAsFloats) {
      push_double(0.0);
    } else {
      push(defs.zero);
    }
    while (iscons(p2)) {
      push(p1);
      push(car(p2));
      multiply();
      add();
      p2 = cdr(p2);
    }
    return;
  }

  // scalar times tensor?
  if (!istensor(p1) && istensor(p2)) {
    push(p1);
    push(p2);
    scalar_times_tensor();
    return;
  }

  // tensor times scalar?
  if (istensor(p1) && !istensor(p2)) {
    push(p1);
    push(p2);
    tensor_times_scalar();
    return;
  }

  // adjust operands
  if (car(p1) === symbol(MULTIPLY)) {
    p1 = cdr(p1);
  } else {
    push(p1);
    list(1);
    p1 = pop();
  }

  if (car(p2) === symbol(MULTIPLY)) {
    p2 = cdr(p2);
  } else {
    push(p2);
    list(1);
    p2 = pop();
  }

  // handle numerical coefficients
  if (isNumericAtom(car(p1)) && isNumericAtom(car(p2))) {
    push(car(p1));
    push(car(p2));
    multiply_numbers();
    p1 = cdr(p1);
    p2 = cdr(p2);
  } else if (isNumericAtom(car(p1))) {
    push(car(p1));
    p1 = cdr(p1);
  } else if (isNumericAtom(car(p2))) {
    push(car(p2));
    p2 = cdr(p2);
  } else {
    if (defs.evaluatingAsFloats) {
      push_double(1.0);
    } else {
      push(defs.one);
    }
  }

  let [p3, p5] = parse_p1(p1);
  let [p4, p6] = parse_p2(p2);

  while (iscons(p1) && iscons(p2)) {
    //    if (car(p1)->gamma && car(p2)->gamma) {
    //      combine_gammas(h)
    //      p1 = cdr(p1)
    //      p2 = cdr(p2)
    //      parse_p1()
    //      parse_p2()
    //      continue
    //    }

    if (caar(p1) === symbol(OPERATOR) && caar(p2) === symbol(OPERATOR)) {
      push_symbol(OPERATOR);
      push(cdar(p1));
      push(cdar(p2));
      append();
      cons();
      p1 = cdr(p1);
      p2 = cdr(p2);
      [p3, p5] = parse_p1(p1);
      [p4, p6] = parse_p2(p2);
      continue;
    }

    switch (cmp_expr(p3, p4)) {
      case -1:
        push(car(p1));
        p1 = cdr(p1);
        [p3, p5] = parse_p1(p1);
        break;
      case 1:
        push(car(p2));
        p2 = cdr(p2);
        [p4, p6] = parse_p2(p2);
        break;
      case 0:
        combine_factors(h, p4, p5, p6);
        p1 = cdr(p1);
        p2 = cdr(p2);
        [p3, p5] = parse_p1(p1);
        [p4, p6] = parse_p2(p2);
        break;
      default:
        stop('internal error 2');
    }
  }

  // push remaining factors, if any
  while (iscons(p1)) {
    push(car(p1));
    p1 = cdr(p1);
  }

  while (iscons(p2)) {
    push(car(p2));
    p2 = cdr(p2);
  }

  // normalize radical factors
  // example: 2*2(-1/2) -> 2^(1/2)
  // must be done after merge because merge may produce radical
  // example: 2^(1/2-a)*2^a -> 2^(1/2)
  __normalize_radical_factors(h);

  // this hack should not be necessary, unless power returns a multiply
  //for (i = h; i < tos; i++) {
  //  if (car(stack[i]) == symbol(MULTIPLY)) {
  //    multiply_all(tos - h)
  //    return
  //  }
  //}
  if (defs.expanding) {
    for (let i = h; i < defs.tos; i++) {
      if (isadd(defs.stack[i])) {
        multiply_all(defs.tos - h);
        return;
      }
    }
  }

  // n is the number of result factors on the stack
  const n = defs.tos - h;
  if (n === 1) {
    return;
  }

  // discard integer 1
  if (isrational(defs.stack[h]) && equaln(defs.stack[h], 1)) {
    if (n === 2) {
      const p7 = pop();
      pop();
      push(p7);
    } else {
      defs.stack[h] = symbol(MULTIPLY);
      list(n);
    }
    return;
  }

  list(n);
  const p7 = pop();
  push_symbol(MULTIPLY);
  push(p7);
  cons();
}

// Decompose a factor into base and power.
//
// input:  car(p1)    factor
//
// output:  p3    factor's base
//
//    p5    factor's power (possibly 1)
function parse_p1(p1: U): [U, U] {
  let p3: U, p5: U;
  p3 = car(p1);
  p5 = defs.evaluatingAsFloats ? defs.one_as_double : defs.one;
  if (car(p3) === symbol(POWER)) {
    p5 = caddr(p3);
    p3 = cadr(p3);
  }
  return [p3, p5];
}

// Decompose a factor into base and power.
//
// input:  car(p2)    factor
//
// output:  p4    factor's base
//
//    p6    factor's power (possibly 1)
function parse_p2(p2: U): [U, U] {
  let p4: U, p6: U;
  p4 = car(p2);
  p6 = defs.evaluatingAsFloats ? defs.one_as_double : defs.one;
  if (car(p4) === symbol(POWER)) {
    p6 = caddr(p4);
    p4 = cadr(p4);
  }
  return [p4, p6];
}

// h an integer
function combine_factors(h: number, p4: U, p5: U, p6: U) {
  let p7: U;
  push(p4);
  push(p5);
  push(p6);
  add();
  power();
  p7 = pop();
  if (isNumericAtom(p7)) {
    push(defs.stack[h]);
    push(p7);
    multiply_numbers();
    defs.stack[h] = pop();
  } else if (car(p7) === symbol(MULTIPLY)) {
    // power can return number * factor (i.e. -1 * i)
    if (isNumericAtom(cadr(p7)) && cdddr(p7) === symbol(NIL)) {
      push(defs.stack[h]);
      push(cadr(p7));
      multiply_numbers();
      defs.stack[h] = pop();
      push(caddr(p7));
    } else {
      push(p7);
    }
  } else {
    push(p7);
  }
}

const gp = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, -6, -7, -8, -3, -4, -5, 13, 14, 15, -16, 9, 10, 11, -12],
  [0, 0, 6, -1, -11, 10, -2, -15, 14, 12, -5, 4, -9, 16, -8, 7, -13],
  [0, 0, 7, 11, -1, -9, 15, -2, -13, 5, 12, -3, -10, 8, 16, -6, -14],
  [0, 0, 8, -10, 9, -1, -14, 13, -2, -4, 3, 12, -11, -7, 6, 16, -15],
  [0, 0, 3, 2, 15, -14, 1, 11, -10, 16, -8, 7, 13, 12, -5, 4, 9],
  [0, 0, 4, -15, 2, 13, -11, 1, 9, 8, 16, -6, 14, 5, 12, -3, 10],
  [0, 0, 5, 14, -13, 2, 10, -9, 1, -7, 6, 16, 15, -4, 3, 12, 11],
  [0, 0, 13, 12, -5, 4, 16, -8, 7, -1, -11, 10, -3, -2, -15, 14, -6],
  [0, 0, 14, 5, 12, -3, 8, 16, -6, 11, -1, -9, -4, 15, -2, -13, -7],
  [0, 0, 15, -4, 3, 12, -7, 6, 16, -10, 9, -1, -5, -14, 13, -2, -8],
  [0, 0, 16, -9, -10, -11, -13, -14, -15, -3, -4, -5, 1, -6, -7, -8, 2],
  [0, 0, 9, -16, 8, -7, -12, 5, -4, -2, -15, 14, 6, -1, -11, 10, 3],
  [0, 0, 10, -8, -16, 6, -5, -12, 3, 15, -2, -13, 7, 11, -1, -9, 4],
  [0, 0, 11, 7, -6, -16, 4, -3, -12, -14, 13, -2, 8, -10, 9, -1, 5],
  [0, 0, 12, 13, 14, 15, 9, 10, 11, -6, -7, -8, -2, -3, -4, -5, -1],
];

// this is useful for example when you are just adding/removing
// factors from an already factored quantity.
// e.g. if you factored x^2 + 3x + 2 into (x+1)(x+2)
// and you want to divide by (x+1) , i.e. you multiply by (x-1)^-1,
// then there is no need to expand.
export function multiply_noexpand() {
  const prev_expanding = defs.expanding;
  defs.expanding = 0;
  multiply();
  defs.expanding = prev_expanding;
}

// multiply n factors on stack
// n an integer
export function multiply_all(n: number) {
  if (n === 1) {
    return;
  }
  if (n === 0) {
    push(defs.evaluatingAsFloats ? defs.one_as_double : defs.one);
    return;
  }
  const h = defs.tos - n;
  push(defs.stack[h]);
  for (let i = 1; i < n; i++) {
    push(defs.stack[h + i]);
    multiply();
  }
  defs.stack[h] = pop();
  moveTos(h + 1);
}

// n an integer
export function multiply_all_noexpand(n: number) {
  const prev_expanding = defs.expanding;
  defs.expanding = 0;
  multiply_all(n);
  defs.expanding = prev_expanding;
}

//-----------------------------------------------------------------------------
//
//  Symbolic division, or numeric division if doubles are found.
//
//  Input:    Dividend and divisor on stack
//
//  Output:    Quotient on stack
//
//-----------------------------------------------------------------------------
export function divide() {
  if (isNumericAtom(defs.stack[defs.tos - 2]) && isNumericAtom(top())) {
    return divide_numbers();
  } else {
    inverse();
    return multiply();
  }
}

// this is different from inverse of a matrix (inv)!
export function inverse() {
  if (isNumericAtom(top())) {
    invert_number();
  } else {
    push_integer(-1);
    power();
  }
}

export function reciprocate() {
  inverse();
}

export function negate() {
  if (isNumericAtom(top())) {
    return negate_number();
  } else {
    if (defs.evaluatingAsFloats) {
      push_double(-1.0);
    } else {
      push_integer(-1);
    }
    return multiply();
  }
}

export function negate_noexpand() {
  const prev_expanding = defs.expanding;
  defs.expanding = 0;
  negate();
  defs.expanding = prev_expanding;
}

//-----------------------------------------------------------------------------
//
//  Normalize radical factors
//
//  Input:    stack[h]  Coefficient factor, possibly 1
//
//      stack[h + 1]  Second factor
//
//      stack[tos - 1]  Last factor
//
//  Output:    Reduced coefficent and normalized radicals (maybe)
//
//  Example:  2*2^(-1/2) -> 2^(1/2)
//
//  (power number number) is guaranteed to have the following properties:
//
//  1. Base is an integer
//
//  2. Absolute value of exponent < 1
//
//  These properties are assured by the power function.
//
//-----------------------------------------------------------------------------

// h is an int
function __normalize_radical_factors(h: number) {
  let i = 0;
  // if coeff is 1 or floating then don't bother
  if (
    isplusone(defs.stack[h]) ||
    isminusone(defs.stack[h]) ||
    isdouble(defs.stack[h])
  ) {
    return;
  }

  // if no radicals then don't bother
  for (i = h + 1; i < defs.tos; i++) {
    if (__is_radical_number(defs.stack[i])) {
      break;
    }
  }

  if (i === defs.tos) {
    return;
  }

  // numerator
  push(defs.stack[h]);
  mp_numerator();
  //console.log("__normalize_radical_factors numerator: " + stack[tos-1])
  let A = pop();

  for (let i = h + 1; i < defs.tos; i++) {
    if (isplusone(A) || isminusone(A)) {
      break;
    }

    if (!__is_radical_number(defs.stack[i])) {
      continue;
    }

    const BASE = cadr(defs.stack[i]);
    const EXPO = caddr(defs.stack[i]);

    // exponent must be negative
    if (!isnegativenumber(EXPO)) {
      continue;
    }

    // numerator divisible by base?
    push(A);
    push(BASE);
    divide();

    const TMP = pop();
    if (!isinteger(TMP)) {
      continue;
    }

    // reduce numerator
    A = TMP;

    // invert radical
    push_symbol(POWER);
    push(BASE);
    push(defs.evaluatingAsFloats ? defs.one_as_double : defs.one);
    push(EXPO);
    add();
    list(3);
    defs.stack[i] = pop();
  }

  // denominator
  push(defs.stack[h]);
  mp_denominator();
  //console.log("__normalize_radical_factors denominator: " + stack[tos-1])
  let B = pop();

  for (let i = h + 1; i < defs.tos; i++) {
    if (isplusone(B)) {
      break;
    }

    if (!__is_radical_number(defs.stack[i])) {
      continue;
    }

    const BASE = cadr(defs.stack[i]);
    const EXPO = caddr(defs.stack[i]);

    // exponent must be positive
    if (isnegativenumber(EXPO)) {
      continue;
    }

    // denominator divisible by BASE?
    push(B);
    push(BASE);
    divide();

    const TMP = pop();

    if (!isinteger(TMP)) {
      continue;
    }
    //console.log("__new radical TMP: " + TMP.toString())
    //console.log("__new radical top stack: " + stack[tos-1])

    // reduce denominator
    B = TMP;

    // invert radical
    push_symbol(POWER);
    push(BASE);
    push(EXPO);
    //console.log("__new radical BASE: " + BASE.toString())
    //console.log("__new radical EXPO: " + EXPO.toString())
    push(defs.one);
    subtract();

    if (dontCreateNewRadicalsInDenominatorWhenEvalingMultiplication) {
      if (isinteger(BASE) && !isinteger(top()) && isnegativenumber(top())) {
        // bail out,
        // we want to avoid going ahead with the subtraction of
        // the exponents, because that would turn a perfectly good
        // integer exponent in the denominator into a fractional one
        // i.e. a radical.
        // Note that this only prevents new radicals ending up
        // in the denominator, it doesn't fix existing ones.
        pop();
        pop();
        pop();

        push(A);
        push(BASE);
        divide();
        A = pop();

        break;
      }
    }
    //console.log("__new radical exponent: " + stack[tos-1])

    list(3);
    defs.stack[i] = pop();
  }

  // reconstitute the coefficient
  push(A);
  push(B);
  divide();
  defs.stack[h] = pop();
}

// don't include i
function __is_radical_number(p: U): boolean {
  // don't use i
  return (
    car(p) === symbol(POWER) &&
    isNumericAtom(cadr(p)) &&
    isNumericAtom(caddr(p)) &&
    !isminusone(cadr(p))
  );
}

//-----------------------------------------------------------------------------
//
//  > a*hilbert(2)
//  ((a,1/2*a),(1/2*a,1/3*a))
//
//  Note that "a" is presumed to be a scalar. Is this correct?
//
//  Yes, because "*" has no meaning if "a" is a tensor.
//  To multiply tensors, "dot" or "outer" should be used.
//
//  > dot(a,hilbert(2))
//  dot(a,((1,1/2),(1/2,1/3)))
//
//  In this case "a" could be a scalar or tensor so the result is not
//  expanded.
//
//-----------------------------------------------------------------------------
