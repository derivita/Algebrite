import {
  ABS,
  ADD,
  ARCTAN,
  ASSUME_REAL_VARIABLES,
  avoidCalculatingPowersIntoArctans,
  caddr,
  cadr,
  car,
  cdr,
  COS,
  defs,
  Double,
  E,
  isadd,
  iscons,
  isdouble,
  isNumericAtom,
  isrational,
  istensor,
  LOG,
  MULTIPLY,
  Num,
  PI,
  POWER,
  SIN,
  symbol,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { pop, push, top } from '../runtime/stack';
import { get_binding, push_symbol } from '../runtime/symbol';
import { equal, exponential, length, sign } from '../sources/misc';
import { abs } from './abs';
import { add, subtract } from './add';
import { arg } from './arg';
import {
  compare_numbers,
  pop_integer,
  push_double,
  push_integer,
  push_rational,
} from './bignum';
import { conjugate } from './conj';
import { cosine } from './cos';
import { dpow } from './dpow';
import { Eval } from './eval';
import { factorial } from './factorial';
import {
  iscomplexnumber,
  iscomplexnumberdouble,
  iseveninteger,
  isinteger,
  isminusone,
  isminusoneovertwo,
  isone,
  isoneovertwo,
  ispositivenumber,
  isquarterturn,
  isZeroAtomOrTensor,
} from './is';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { qpow } from './qpow';
import { rect } from './rect';
import { sine } from './sin';
import { power_tensor } from './tensor';
/* Power function

  Input:    push  Base

      push  Exponent

  Output:    Result on stack
*/
const DEBUG_POWER = false;

export function Eval_power(p1: U) {
  if (DEBUG_POWER) {
    debugger;
  }
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  power();
}

export function power() {
  yypower();
  return;
}

function yypower() {
  if (DEBUG_POWER) {
    debugger;
  }
  const exponent = pop();
  let base = pop();

  const inputExp = exponent;
  const inputBase = base;
  //debugger

  if (DEBUG_POWER) {
    console.log('POWER: ' + base + ' ^ ' + exponent);
  }

  // first, some very basic simplifications right away

  //  1 ^ a    ->  1
  //  a ^ 0    ->  1
  if (equal(base, defs.one) || isZeroAtomOrTensor(exponent)) {
    if (defs.evaluatingAsFloats) {
      push_double(1.0);
    } else {
      push(defs.one);
    }
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  //  a ^ 1    ->  a
  if (equal(exponent, defs.one)) {
    push(base);
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  //   -1 ^ -1    ->  -1
  if (isminusone(base) && isminusone(exponent)) {
    if (defs.evaluatingAsFloats) {
      push_double(1.0);
    } else {
      push(defs.one);
    }
    negate();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  //   -1 ^ 1/2  ->  i
  if (isminusone(base) && isoneovertwo(exponent)) {
    push(defs.imaginaryunit);
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  //   -1 ^ -1/2  ->  -i
  if (isminusone(base) && isminusoneovertwo(exponent)) {
    push(defs.imaginaryunit);
    negate();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  //   -1 ^ rational
  if (
    isminusone(base) &&
    !isdouble(base) &&
    isrational(exponent) &&
    !isinteger(exponent) &&
    ispositivenumber(exponent) &&
    !defs.evaluatingAsFloats
  ) {
    if (DEBUG_POWER) {
      console.log('   power: -1 ^ rational');
    }
    if (DEBUG_POWER) {
      console.log(
        ' trick: exponent.q.a , exponent.q.b ' +
          exponent.q.a +
          ' , ' +
          exponent.q.b
      );
    }
    if (exponent.q.a < exponent.q.b) {
      push_symbol(POWER);
      push(base);
      push(exponent);
      list(3);
    } else {
      push_symbol(MULTIPLY);

      push(base);

      push_symbol(POWER);
      push(base);
      push_rational(exponent.q.a.mod(exponent.q.b), exponent.q.b);
      list(3);

      list(3);
      if (DEBUG_POWER) {
        console.log(' trick applied : ' + top());
      }
    }

    // evaluates clock form into
    // rectangular form. This seems to give
    // slightly better form to some test results.
    rect();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // both base and exponent are rational numbers?
  if (isrational(base) && isrational(exponent)) {
    if (DEBUG_POWER) {
      console.log('   power: isrational(base) && isrational(exponent)');
    }
    push(base);
    push(exponent);
    qpow();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // both base and exponent are either rational or double?
  if (isNumericAtom(base) && isNumericAtom(exponent)) {
    if (DEBUG_POWER) {
      console.log(
        '   power: both base and exponent are either rational or double '
      );
    }
    if (DEBUG_POWER) {
      console.log('POWER - isNumericAtom(base) && isNumericAtom(exponent)');
    }
    push(base);
    push(exponent);
    dpow();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  if (istensor(base)) {
    if (DEBUG_POWER) {
      console.log('   power: istensor(base) ');
    }
    power_tensor(base, exponent);
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // if we only assume variables to be real, then |a|^2 = a^2
  // (if x is complex this doesn't hold e.g. i, which makes 1 and -1
  if (
    car(base) === symbol(ABS) &&
    iseveninteger(exponent) &&
    !isZeroAtomOrTensor(get_binding(symbol(ASSUME_REAL_VARIABLES)))
  ) {
    if (DEBUG_POWER) {
      console.log('   power: even power of absolute of real value ');
    }
    push(cadr(base));
    push(exponent);
    power();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // e^log(...)
  if (base === symbol(E) && car(exponent) === symbol(LOG)) {
    push(cadr(exponent));
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // e^some_float
  if (base === symbol(E) && isdouble(exponent)) {
    if (DEBUG_POWER) {
      console.log('   power: base == symbol(E) && isdouble(exponent) ');
    }
    push_double(Math.exp(exponent.d));
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // complex number in exponential form, get it to rectangular
  // but only if we are not in the process of calculating a polar form,
  // otherwise we'd just undo the work we want to do
  if (
    base === symbol(E) &&
    Find(exponent, defs.imaginaryunit) &&
    Find(exponent, symbol(PI)) &&
    !defs.evaluatingPolar
  ) {
    push_symbol(POWER);
    push(base);
    push(exponent);
    list(3);
    if (DEBUG_POWER) {
      console.log('   power: turning complex exponential to rect: ' + top());
    }
    rect();

    const hopefullySimplified = pop(); // put new (hopefully simplified expr) in exponent
    if (!Find(hopefullySimplified, symbol(PI))) {
      if (DEBUG_POWER) {
        console.log(
          '   power: turned complex exponential to rect: ' + hopefullySimplified
        );
      }
      push(hopefullySimplified);
      return;
    }
  }

  //  (a * b) ^ c  ->  (a ^ c) * (b ^ c)
  // note that we can't in general do this, for example
  // sqrt(x*y) != x^(1/2) y^(1/2) (counterexample" x = -1 and y = -1)
  // BUT we can carve-out here some cases where this
  // transformation is correct
  if (car(base) === symbol(MULTIPLY) && isinteger(exponent)) {
    if (DEBUG_POWER) {
      console.log('   power: (a * b) ^ c  ->  (a ^ c) * (b ^ c) ');
    }
    base = cdr(base);
    push(car(base));
    push(exponent);
    power();
    base = cdr(base);
    while (iscons(base)) {
      push(car(base));
      push(exponent);
      power();
      multiply();
      base = cdr(base);
    }
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // (a ^ b) ^ c  ->  a ^ (b * c)
  // note that we can't in general do this, for example
  // sqrt(x^y) !=  x^(1/2 y) (counterexample x = -1)
  // BUT we can carve-out here some cases where this
  // transformation is correct
  // simple numeric check to see if a is a number > 0
  let is_a_moreThanZero = false;
  if (isNumericAtom(cadr(base))) {
    is_a_moreThanZero =
      sign(compare_numbers(cadr(base) as Num | Double, defs.zero)) > 0;
  }

  if (
    car(base) === symbol(POWER) && // when c is an integer
    (isinteger(exponent) || is_a_moreThanZero) // when a is >= 0
  ) {
    push(cadr(base));
    push(caddr(base));
    push(exponent);
    multiply();
    power();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  let b_isEven_and_c_isItsInverse = false;
  if (iseveninteger(caddr(base))) {
    push(caddr(base));
    push(exponent);
    multiply();

    const isThisOne = pop();
    if (isone(isThisOne)) {
      b_isEven_and_c_isItsInverse = true;
    }
  }

  if (car(base) === symbol(POWER) && b_isEven_and_c_isItsInverse) {
    if (DEBUG_POWER) {
      console.log(
        '   power: car(base) == symbol(POWER) && b_isEven_and_c_isItsInverse '
      );
    }
    push(cadr(base));
    abs();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  //  when expanding,
  //  (a + b) ^ n  ->  (a + b) * (a + b) ...
  if (defs.expanding && isadd(base) && isNumericAtom(exponent)) {
    push(exponent);
    const n = pop_integer();
    if (n > 1 && !isNaN(n)) {
      if (DEBUG_POWER) {
        console.log(
          '   power: expanding && isadd(base) && isNumericAtom(exponent) '
        );
      }
      power_sum(n, base);
      if (DEBUG_POWER) {
        console.log(
          '   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top()
        );
      }
      return;
    }
  }

  //  sin(x) ^ 2n -> (1 - cos(x) ^ 2) ^ n
  if (
    defs.trigmode === 1 &&
    car(base) === symbol(SIN) &&
    iseveninteger(exponent)
  ) {
    if (DEBUG_POWER) {
      console.log(
        '   power: trigmode == 1 && car(base) == symbol(SIN) && iseveninteger(exponent) '
      );
    }
    push_integer(1);
    push(cadr(base));
    cosine();
    push_integer(2);
    power();
    subtract();
    push(exponent);
    push_rational(1, 2);
    multiply();
    power();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  //  cos(x) ^ 2n -> (1 - sin(x) ^ 2) ^ n
  if (
    defs.trigmode === 2 &&
    car(base) === symbol(COS) &&
    iseveninteger(exponent)
  ) {
    if (DEBUG_POWER) {
      console.log(
        '   power: trigmode == 2 && car(base) == symbol(COS) && iseveninteger(exponent) '
      );
    }
    push_integer(1);
    push(cadr(base));
    sine();
    push_integer(2);
    power();
    subtract();
    push(exponent);
    push_rational(1, 2);
    multiply();
    power();
    if (DEBUG_POWER) {
      console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
    }
    return;
  }

  // complex number? (just number, not expression)
  if (iscomplexnumber(base)) {
    if (DEBUG_POWER) {
      console.log(' power - handling the case (a + ib) ^ n');
    }
    // integer power?
    // n will be negative here, positive n already handled
    if (isinteger(exponent)) {
      //               /        \  n
      //         -n   |  a - ib  |
      // (a + ib)   = | -------- |
      //              |   2   2  |
      //               \ a + b  /
      push(base);
      conjugate();
      const p3 = pop();
      push(p3);

      // gets the denominator
      push(p3);
      push(base);
      multiply();

      divide();

      if (!isone(exponent)) {
        push(exponent);
        negate();
        power();
      }

      if (DEBUG_POWER) {
        console.log(
          '   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top()
        );
      }
      return;
    }

    // noninteger or floating power?
    if (isNumericAtom(exponent)) {
      push(base);
      abs();
      push(exponent);
      power();
      push_integer(-1);
      push(base);
      arg();
      push(exponent);
      multiply();
      if (
        defs.evaluatingAsFloats ||
        (iscomplexnumberdouble(base) && isdouble(exponent))
      ) {
        // remember that the "double" type is
        // toxic, i.e. it propagates, so we do
        // need to evaluate PI to its actual double
        // value
        push_double(Math.PI);
      } else {
        //console.log("power pushing PI when base is: " + base + " and exponent is:" + exponent)
        push(symbol(PI));
      }
      divide();
      power();
      multiply();

      // if we calculate the power making use of arctan:
      //  * it prevents nested radicals from being simplified
      //  * results become really hard to manipulate afterwards
      //  * we can't go back to other forms.
      // so leave the power as it is.
      if (avoidCalculatingPowersIntoArctans) {
        if (Find(top(), symbol(ARCTAN))) {
          pop();
          push_symbol(POWER);
          push(base);
          push(exponent);
          list(3);
        }
      }

      if (DEBUG_POWER) {
        console.log(
          '   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top()
        );
      }
      return;
    }
  }

  //
  //push(base)
  //abs()
  //push(exponent)
  //power()
  //push(symbol(E))
  //push(base)
  //arg()
  //push(exponent)
  //multiply()
  //push(imaginaryunit)
  //multiply()
  //power()
  //multiply()
  //

  if (simplify_polar(exponent)) {
    if (DEBUG_POWER) {
      console.log('   power: using simplify_polar');
    }
    return;
  }

  if (DEBUG_POWER) {
    console.log('   power: nothing can be done ');
  }
  push_symbol(POWER);
  push(base);
  push(exponent);
  list(3);
  if (DEBUG_POWER) {
    console.log('   power of ' + inputBase + ' ^ ' + inputExp + ': ' + top());
  }
}

//-----------------------------------------------------------------------------
//
//  Compute the power of a sum
//
//  Input:    p1  sum
//
//      n  exponent
//
//  Output:    Result on stack
//
//  Note:
//
//  Uses the multinomial series (see Math World)
//
//                          n              n!          n1   n2       nk
//  (a1 + a2 + ... + ak)  = sum (--------------- a1   a2   ... ak  )
//                               n1! n2! ... nk!
//
//  The sum is over all n1 ... nk such that n1 + n2 + ... + nk = n.
//
//-----------------------------------------------------------------------------

// first index is the term number 0..k-1, second index is the exponent 0..n
//define A(i, j) frame[(i) * (n + 1) + (j)]
function power_sum(n: number, p1: U) {
  const a: number[] = [];
  // number of terms in the sum
  const k = length(p1) - 1;

  // array of powers
  const powers: U[] = [];

  p1 = cdr(p1);
  for (let i = 0; i < k; i++) {
    for (let j = 0; j <= n; j++) {
      push(car(p1));
      push_integer(j);
      power();
      powers[i * (n + 1) + j] = pop();
    }
    p1 = cdr(p1);
  }

  push_integer(n);
  factorial();
  p1 = pop();

  for (let i = 0; i < k; i++) {
    a[i] = 0;
  }

  push(defs.zero);

  multinomial_sum(k, n, a, 0, n, powers, p1);
}

//-----------------------------------------------------------------------------
//
//  Compute multinomial sum
//
//  Input:    k  number of factors
//
//      n  overall exponent
//
//      a  partition array
//
//      i  partition array index
//
//      m  partition remainder
//
//      p1  n!
//
//      A  factor array
//
//  Output:    Result on stack
//
//  Note:
//
//  Uses recursive descent to fill the partition array.
//
//-----------------------------------------------------------------------------
function multinomial_sum(
  k: number,
  n: number,
  a: number[],
  i: number,
  m: number,
  A: U[],
  p1: U
) {
  if (i < k - 1) {
    for (let j = 0; j <= m; j++) {
      a[i] = j;
      multinomial_sum(k, n, a, i + 1, m - j, A, p1);
    }
    return;
  }

  a[i] = m;

  // coefficient
  push(p1);

  for (let j = 0; j < k; j++) {
    push_integer(a[j]);
    factorial();
    divide();
  }

  // factors
  for (let j = 0; j < k; j++) {
    push(A[j * (n + 1) + a[j]]);
    multiply();
  }

  add();
}

// exp(n/2 i pi) ?
// clobbers p3
function simplify_polar(exponent: U) {
  let n = isquarterturn(exponent);
  switch (n) {
    case 0:
      // do nothing
      break;
    case 1:
      push_integer(1);
      return 1;
    case 2:
      push_integer(-1);
      return 1;
    case 3:
      push(defs.imaginaryunit);
      return 1;
    case 4:
      push(defs.imaginaryunit);
      negate();
      return 1;
  }

  if (car(exponent) === symbol(ADD)) {
    let p3 = cdr(exponent);
    while (iscons(p3)) {
      n = isquarterturn(car(p3));
      if (n) {
        break;
      }
      p3 = cdr(p3);
    }
    switch (n) {
      case 0:
        return 0;
      case 1:
        push_integer(1);
        break;
      case 2:
        push_integer(-1);
        break;
      case 3:
        push(defs.imaginaryunit);
        break;
      case 4:
        push(defs.imaginaryunit);
        negate();
        break;
    }
    push(exponent);
    push(car(p3));
    subtract();
    exponential();
    multiply();
    return 1;
  }

  return 0;
}
