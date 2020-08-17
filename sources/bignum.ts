import bigInt from 'big-integer';
import {
  DEBUG,
  defs,
  Double,
  DOUBLE,
  isdouble,
  isNumericAtom,
  isrational,
  Num,
  NUM,
  PRINTMODE_LATEX,
  Sign,
  U,
} from '../runtime/defs';
import { mcmp } from '../runtime/mcmp';
import { doubleToReasonableString } from '../runtime/otherCFunctions';
import { stop } from '../runtime/run';
import { pop, push, top } from '../runtime/stack';
import { isfraction, isinteger, isZeroAtomOrTensor } from './is';
import { mgcd } from './mgcd';
import { mdiv, mmul } from './mmul';
import { mpow } from './mpow';
import { negate } from './multiply';
import { qadd } from './qadd';
import { qdiv } from './qdiv';
import { qmul } from './qmul';

//double convert_rational_to_double(U *)
//double convert_bignum_to_double(unsigned int *)
//int ge(unsigned int *, unsigned int *, int)

export function mint(a: number): bigInt.BigInteger {
  return bigInt(a);
}

export function isSmall(a: bigInt.BigInteger): boolean {
  return a.geq(Number.MIN_SAFE_INTEGER) && a.leq(Number.MAX_SAFE_INTEGER);
}

// b is +1 or -1
export function setSignTo(a: bigInt.BigInteger, b: Sign) {
  if (a.isPositive()) {
    if (b < 0) {
      return a.multiply(bigInt(-1));
    }
  } else {
    // a is negative
    if (b > 0) {
      return a.multiply(bigInt(-1));
    }
  }
  return a;
}

export function makeSignSameAs(
  a: bigInt.BigInteger,
  b: bigInt.BigInteger
): bigInt.BigInteger {
  if (a.isPositive()) {
    if (b.isNegative()) {
      return a.multiply(bigInt(-1));
    }
  } else {
    // a is negative
    if (b.isPositive()) {
      return a.multiply(bigInt(-1));
    }
  }
  return a;
}

export function makePositive(a: bigInt.BigInteger): bigInt.BigInteger {
  if (a.isNegative()) {
    return a.multiply(bigInt(-1));
  }
  return a;
}

// n is an int
/*
mtotal = 0
MP_MIN_SIZE = 2
MP_MAX_FREE  = 1000

mnew = (n) ->
  if (n < MP_MIN_SIZE)
    n = MP_MIN_SIZE
  if (n == MP_MIN_SIZE && mfreecount)
    p = free_stack[--mfreecount]
  else
    p = [] #(unsigned int *) malloc((n + 3) * sizeof (int))
    *if (p == 0)
    *  stop("malloc failure")
  p[0] = n
  mtotal += n
  return p[3]
*/

// p is the index of array of ints
// !!! array wasn't passed here
/*
free_stack = []

mfree = (array, p) ->
  p -= 3
  mtotal -= array[p]
  if (array[p] == MP_MIN_SIZE && mfreecount < MP_MAX_FREE)
    free_stack[mfreecount++] = p
  else
    free(p)
*/

// convert int to bignum

// n is an int
/*
mint = (n) ->
  p = mnew(1)
  if (n < 0)
    * !!! this is FU
    * MSIGN(p) = -1
    fu = true
  else
    * !!! this is FU
    *MSIGN(p) = 1
    fu = true
  * !!! this is FU
  *MLENGTH(p) = 1
  p[0] = Math.abs(n)
  return p
*/

// copy bignum

// a is an array of ints
/*
mcopy = (a) ->
  *unsigned int *b

  b = mnew(MLENGTH(a))

  * !!! fu
  *MSIGN(b) = MSIGN(a)
  *MLENGTH(b) = MLENGTH(a)

  for i in [0...MLENGTH(a)]
    b[i] = a[i]

  return b
*/

/*
* 
* ge not invoked from anywhere - is you need ge
* just use the bigNum's ge implementation
* leaving it here just in case I decide to backport to C
*
* a >= b ?
* and and b arrays of ints, len is an int
ge = (a, b, len) ->
  i = 0
  for i in [0...len]
    if (a[i] == b[i])
      continue
    else
      break
  if (a[i] >= b[i])
    return 1
  else
    return 0
*/
export function add_numbers() {
  let a = 1.0;
  let b = 1.0;

  //if DEBUG then console.log("add_numbers adding numbers: " + print_list(stack[tos - 1]) + " and " + print_list(stack[tos - 2]))

  if (isrational(top()) && isrational(defs.stack[defs.tos - 2])) {
    qadd();
    return;
  }

  const p2 = pop() as Num | Double;
  const p1 = pop() as Num | Double;

  if (isdouble(p1)) {
    a = p1.d;
  } else {
    a = convert_rational_to_double(p1);
  }

  if (isdouble(p2)) {
    b = p2.d;
  } else {
    b = convert_rational_to_double(p2);
  }

  const theResult = a + b;
  push_double(theResult);
}

export function multiply_numbers() {
  let a = 0.0;
  let b = 0.0;

  if (isrational(top()) && isrational(defs.stack[defs.tos - 2])) {
    qmul();
    return;
  }

  const p2 = pop() as Num | Double;
  const p1 = pop() as Num | Double;

  if (isdouble(p1)) {
    a = p1.d;
  } else {
    a = convert_rational_to_double(p1);
  }

  if (isdouble(p2)) {
    b = p2.d;
  } else {
    b = convert_rational_to_double(p2);
  }

  push_double(a * b);

  return;
}

export function divide_numbers() {
  let a = 0.0;
  let b = 0.0;

  if (isrational(top()) && isrational(defs.stack[defs.tos - 2])) {
    qdiv();
    return;
  }

  const p2 = pop() as Num | Double;
  const p1 = pop() as Num | Double;

  if (isZeroAtomOrTensor(p2)) {
    stop('divide by zero');
  }

  if (isdouble(p1)) {
    a = p1.d;
  } else {
    a = convert_rational_to_double(p1);
  }

  if (isdouble(p2)) {
    b = p2.d;
  } else {
    b = convert_rational_to_double(p2);
  }

  push_double(a / b);

  return;
}

export function invert_number() {
  let p1 = pop_number();

  if (isZeroAtomOrTensor(p1)) {
    stop('divide by zero');
  }

  if (isdouble(p1)) {
    push_double(1 / p1.d);
    return;
  }

  let a = bigInt(p1.q.a);
  let b = bigInt(p1.q.b);

  b = makeSignSameAs(b, a);
  a = setSignTo(a, 1);

  p1 = new Num(b, a);

  push(p1);
}

function compare_rationals(a: Num, b: Num): Sign {
  //unsigned int *ab, *ba
  const ab = mmul(a.q.a, b.q.b);
  const ba = mmul(a.q.b, b.q.a);
  return mcmp(ab, ba);
}

export function compare_numbers(a: Num | Double, b: Num | Double): Sign {
  let x = 0.0;
  let y = 0.0;
  if (isrational(a) && isrational(b)) {
    return compare_rationals(a, b);
  }
  if (isdouble(a)) {
    x = a.d;
  } else {
    x = convert_rational_to_double(a);
  }
  if (isdouble(b)) {
    y = b.d;
  } else {
    y = convert_rational_to_double(b);
  }
  if (x < y) {
    return -1;
  }
  if (x > y) {
    return 1;
  }
  return 0;
}

export function negate_number() {
  const p1 = pop();
  if (isZeroAtomOrTensor(p1)) {
    push(p1);
    return;
  }

  switch (p1.k) {
    case NUM:
      const p2 = new Num(
        bigInt(p1.q.a.multiply(bigInt.minusOne)),
        bigInt(p1.q.b)
      );
      push(p2);
      break;
    case DOUBLE:
      push_double(-p1.d);
      break;
    default:
      stop('bug caught in mp_negate_number');
  }
  return;
}

export function bignum_truncate() {
  let p1 = pop() as Num;

  const a = mdiv(p1.q.a, p1.q.b);

  p1 = new Num(a);
  push(p1);
}

export function mp_numerator() {
  const p1 = pop();

  if (p1.k !== NUM) {
    push(defs.one);
    return;
  }

  const p2 = new Num(bigInt(p1.q.a));
  push(p2);
}

export function mp_denominator() {
  const p1 = pop();

  if (p1.k !== NUM) {
    push(defs.one);
    return;
  }

  const p2 = new Num(bigInt(p1.q.b));
  push(p2);
}

// expo is an integer
export function bignum_power_number(expo: number) {
  let p1 = pop() as Num;

  let a = mpow(p1.q.a, Math.abs(expo));
  let b = mpow(p1.q.b, Math.abs(expo));

  if (expo < 0) {
    // swap a and b
    const t = a;
    a = b;
    b = t;

    a = makeSignSameAs(a, b);
    b = setSignTo(b, 1);
  }

  p1 = new Num(a, b);

  push(p1);
}

// p an array of ints
function convert_bignum_to_double(p) {
  return p.toJSNumber();
}

export function convert_rational_to_double(p: Num) {
  if (p.q == null) {
    debugger;
  }
  const quotientAndRemainder = p.q.a.divmod(p.q.b);
  const result =
    quotientAndRemainder.quotient.toJSNumber() +
    quotientAndRemainder.remainder.toJSNumber() / p.q.b.toJSNumber();

  return result;
}

// n an integer
export function push_integer(n: number) {
  if (DEBUG) {
    console.log('pushing integer ' + n);
  }
  push(new Num(bigInt(n)));
}

export function push_double(d: number) {
  push(new Double(d));
}

export function push_rational(
  a: number | bigInt.BigInteger,
  b: number | bigInt.BigInteger
) {
  // `as any as number` cast added because bigInt(number) and bigInt(bigInt.BigInteger)
  // are both accepted signatures, but bigInt(number|bigInt.BigInteger) is not
  push(new Num(bigInt((a as any) as number), bigInt((b as any) as number)));
}

export function pop_integer() {
  let n = NaN;
  const p1 = pop();

  switch (p1.k) {
    case NUM:
      if (isinteger(p1) && isSmall(p1.q.a)) {
        n = p1.q.a.toJSNumber();
      }
      break;
    case DOUBLE:
      if (DEBUG) {
        console.log('popping integer but double is found');
      }
      if (Math.floor(p1.d) === p1.d) {
        if (DEBUG) {
          console.log("...although it's an integer");
        }
        n = p1.d;
      }
      break;
  }
  return n;
}

export function bignum_scan_integer(s: string) {
  let scounter = 0;

  const sign_ = s[scounter];

  if (sign_ === '+' || sign_ === '-') {
    scounter++;
  }

  // !!!! some mess in here, added an argument
  const a = bigInt(s.substring(scounter));

  const p1 = new Num(a);

  push(p1);

  if (sign_ === '-') {
    negate();
  }
}

export function bignum_scan_float(s: string) {
  push_double(parseFloat(s));
}

// gives the capability of printing the unsigned
// value. This is handy because printing of the sign
// might be taken care of "upstream"
// e.g. when printing a base elevated to a negative exponent
// prints the inverse of the base powered to the unsigned
// exponent.
export function print_number(p: U, signed: boolean) {
  let accumulator = '';

  let denominatorString = '';
  const buf = '';
  switch (p.k) {
    case NUM:
      var aAsString = p.q.a.toString();
      if (!signed) {
        if (aAsString[0] === '-') {
          aAsString = aAsString.substring(1);
        }
      }

      if (defs.printMode === PRINTMODE_LATEX && isfraction(p)) {
        aAsString = '\\frac{' + aAsString + '}{';
      }

      accumulator += aAsString;

      if (isfraction(p)) {
        if (defs.printMode !== PRINTMODE_LATEX) {
          accumulator += '/';
        }
        denominatorString = p.q.b.toString();
        if (defs.printMode === PRINTMODE_LATEX) {
          denominatorString += '}';
        }

        accumulator += denominatorString;
      }
      break;

    case DOUBLE:
      aAsString = doubleToReasonableString(p.d);
      if (!signed) {
        if (aAsString[0] === '-') {
          aAsString = aAsString.substring(1);
        }
      }

      accumulator += aAsString;
      break;
  }

  return accumulator;
}

export function gcd_numbers() {
  const p2 = pop() as Num;
  const p1 = pop() as Num;

  //  if (!isinteger(p1) || !isinteger(p2))
  //    stop("integer args expected for gcd")

  const a = mgcd(p1.q.a, p2.q.a);
  const b = mgcd(p1.q.b, p2.q.b);

  const p3 = new Num(setSignTo(a, 1), b);

  push(p3);
}

export function pop_double() {
  let d = 0.0;
  const p1 = pop();
  switch (p1.k) {
    case NUM:
      d = convert_rational_to_double(p1);
      break;
    case DOUBLE:
      ({ d } = p1);
      break;
    default:
      d = 0.0;
  }
  return d;
}

export function pop_number() {
  const n = pop();
  if (!isNumericAtom(n)) {
    stop('not a number');
  }
  return n;
}

export function bignum_float() {
  const n = pop() as Num;
  const d = convert_rational_to_double(n);
  push_double(d);
}

//static unsigned int *__factorial(int)

// n is an int
export function bignum_factorial(n: number) {
  push(new Num(__factorial(n)));
}

// n is an int
function __factorial(n: number): bigInt.BigInteger {
  let a: bigInt.BigInteger;
  // unsigned int *a, *b, *t

  if (n === 0 || n === 1) {
    a = bigInt(1);
    return a;
  }

  a = bigInt(2);

  let b = bigInt(0);

  if (3 <= n) {
    for (let i = 3; i <= n; i++) {
      b = bigInt(i);
      a = mmul(a, b);
    }
  }

  return a;
}

const mask = [
  0x00000001,
  0x00000002,
  0x00000004,
  0x00000008,
  0x00000010,
  0x00000020,
  0x00000040,
  0x00000080,
  0x00000100,
  0x00000200,
  0x00000400,
  0x00000800,
  0x00001000,
  0x00002000,
  0x00004000,
  0x00008000,
  0x00010000,
  0x00020000,
  0x00040000,
  0x00080000,
  0x00100000,
  0x00200000,
  0x00400000,
  0x00800000,
  0x01000000,
  0x02000000,
  0x04000000,
  0x08000000,
  0x10000000,
  0x20000000,
  0x40000000,
  0x80000000,
];

// unsigned int *x, unsigned int k
function mp_clr_bit(x, k) {
  console.log('not implemented yet');
  debugger;
  return (x[k / 32] &= ~mask[k % 32]);
}
