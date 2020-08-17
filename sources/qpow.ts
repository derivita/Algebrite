import bigInt from 'big-integer';
import { defs, Num, POWER, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import {
  bignum_truncate,
  isSmall,
  makePositive,
  makeSignSameAs,
  mp_denominator,
  mp_numerator,
  pop_integer,
  push_integer,
} from './bignum';
import {
  isinteger,
  isminusone,
  isnegativenumber,
  isoneovertwo,
  isplusone,
  isZeroAtomOrTensor,
} from './is';
import { list } from './list';
import { mpow } from './mpow';
import { mroot } from './mroot';
import { multiply, negate } from './multiply';
import { quickfactor } from './quickfactor';
// Rational power function
export function qpow() {
  qpowf();
}

function qpowf() {
  //unsigned int a, b, *t, *x, *y

  const EXPO = pop() as Num;
  const BASE = pop() as Num;

  // if base is 1 or exponent is 0 then return 1
  if (isplusone(BASE) || isZeroAtomOrTensor(EXPO)) {
    push_integer(1);
    return;
  }

  // if (-1)^(1/2) -> leave it as is
  if (isminusone(BASE) && isoneovertwo(EXPO)) {
    push(defs.imaginaryunit);
    return;
  }

  // if base is zero then return 0
  if (isZeroAtomOrTensor(BASE)) {
    if (isnegativenumber(EXPO)) {
      stop('divide by zero');
    }
    push(defs.zero);
    return;
  }

  // if exponent is 1 then return base
  if (isplusone(EXPO)) {
    push(BASE);
    return;
  }

  let expo = 0;
  let x: bigInt.BigInteger | 0;
  let y: bigInt.BigInteger;
  // if exponent is integer then power
  if (isinteger(EXPO)) {
    push(EXPO);
    expo = pop_integer();
    if (isNaN(expo)) {
      // expo greater than 32 bits
      push_symbol(POWER);
      push(BASE);
      push(EXPO);
      list(3);
      return;
    }

    x = mpow(BASE.q.a, Math.abs(expo));
    y = mpow(BASE.q.b, Math.abs(expo));
    if (expo < 0) {
      const t = x;
      x = y;
      y = t;
      x = makeSignSameAs(x, y);
      y = makePositive(y);
    }

    push(new Num(x, y));
    return;
  }

  // from here on out the exponent is NOT an integer

  // if base is -1 then normalize polar angle
  if (isminusone(BASE)) {
    push(EXPO);
    normalize_angle();
    return;
  }

  // if base is negative then (-N)^M -> N^M * (-1)^M
  if (isnegativenumber(BASE)) {
    push(BASE);
    negate();
    push(EXPO);
    qpow();

    push_integer(-1);
    push(EXPO);
    qpow();

    multiply();
    return;
  }

  // if BASE is not an integer then power numerator and denominator
  if (!isinteger(BASE)) {
    push(BASE);
    mp_numerator();
    push(EXPO);
    qpow();
    push(BASE);
    mp_denominator();
    push(EXPO);
    negate();
    qpow();
    multiply();
    return;
  }

  // At this point BASE is a positive integer.

  // If BASE is small then factor it.
  if (is_small_integer(BASE)) {
    push(BASE);
    push(EXPO);
    quickfactor();
    return;
  }

  // At this point BASE is a positive integer and EXPO is not an integer.
  if (!isSmall(EXPO.q.a) || !isSmall(EXPO.q.b)) {
    push_symbol(POWER);
    push(BASE);
    push(EXPO);
    list(3);
    return;
  }

  const { a } = EXPO.q;
  const { b } = EXPO.q;

  x = mroot(BASE.q.a, b.toJSNumber());

  if (x === 0) {
    push_symbol(POWER);
    push(BASE);
    push(EXPO);
    list(3);
    return;
  }

  y = mpow(x, a);

  let p3: U;
  if (EXPO.q.a.isNegative()) {
    p3 = new Num(bigInt.one, y);
  } else {
    p3 = new Num(y);
  }

  push(p3);
}

//-----------------------------------------------------------------------------
//
//  Normalize the angle of unit imaginary, i.e. (-1) ^ N
//
//  Input:    N on stack (must be rational, not float)
//
//  Output:    Result on stack
//
//  Note:
//
//  n = q * d + r
//
//  Example:
//            n  d  q  r
//
//  (-1)^(8/3)  ->   (-1)^(2/3)  8  3  2  2
//  (-1)^(7/3)  ->   (-1)^(1/3)  7  3  2  1
//  (-1)^(5/3)  ->  -(-1)^(2/3)  5  3  1  2
//  (-1)^(4/3)  ->  -(-1)^(1/3)  4  3  1  1
//  (-1)^(2/3)  ->   (-1)^(2/3)  2  3  0  2
//  (-1)^(1/3)  ->   (-1)^(1/3)  1  3  0  1
//
//  (-1)^(-1/3)  ->  -(-1)^(2/3)  -1  3  -1  2
//  (-1)^(-2/3)  ->  -(-1)^(1/3)  -2  3  -1  1
//  (-1)^(-4/3)  ->   (-1)^(2/3)  -4  3  -2  2
//  (-1)^(-5/3)  ->   (-1)^(1/3)  -5  3  -2  1
//  (-1)^(-7/3)  ->  -(-1)^(2/3)  -7  3  -3  2
//  (-1)^(-8/3)  ->  -(-1)^(1/3)  -8  3  -3  1
//
//-----------------------------------------------------------------------------
function normalize_angle() {
  let A = pop();

  // integer exponent?
  if (isinteger(A)) {
    if (A.q.a.isOdd()) {
      push_integer(-1); // odd exponent
    } else {
      push_integer(1); // even exponent
    }
    return;
  }

  // floor
  push(A);
  bignum_truncate();
  let Q = pop() as Num;

  if (isnegativenumber(A)) {
    push(Q);
    push_integer(-1);
    add();
    Q = pop() as Num;
  }

  // remainder (always positive)
  push(A);
  push(Q);
  subtract();
  let R = pop();

  // remainder becomes new angle
  push_symbol(POWER);
  push_integer(-1);
  push(R);
  list(3);

  // negate if quotient is odd
  if (Q.q.a.isOdd()) {
    negate();
  }
}

function is_small_integer(p: Num): boolean {
  return isSmall(p.q.a);
}
