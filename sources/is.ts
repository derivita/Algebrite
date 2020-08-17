import {
  ADD,
  BaseAtom,
  cadddr,
  caddr,
  cadr,
  car,
  cdr,
  DEBUG,
  defs,
  DOUBLE,
  Double,
  FLOATF,
  iscons,
  isdouble,
  isNumericAtom,
  isNumericAtomOrTensor,
  isrational,
  issymbol,
  MEQUAL,
  MSIGN,
  MULTIPLY,
  MZERO,
  NUM,
  Num,
  PI,
  POWER,
  symbol,
  SYMBOL_X,
  SYMBOL_Y,
  SYMBOL_Z,
  TENSOR,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { pop, push } from '../runtime/stack';
import { equal, length } from '../sources/misc';
import { absValFloat } from './abs';
import { pop_integer, push_integer } from './bignum';
import { Eval_predicate } from './eval';
import { zzfloat } from './float';
import { guess } from './guess';
import { multiply } from './multiply';
const DEBUG_IS = false;

// this routine is a simple check on whether we have
// a basic zero in our hands. It doesn't perform any
// calculations or simplifications.
export function isZeroAtom(p: U): boolean {
  switch (p.k) {
    case NUM:
      if (MZERO(p.q.a)) {
        return true;
      }
      break;
    case DOUBLE:
      if (p.d === 0.0) {
        return true;
      }
      break;
  }
  return false;
}

// this routine is a simple check on whether we have
// a basic zero in our hands. It doesn't perform any
// calculations or simplifications.
function isZeroTensor(p: U): boolean {
  if (p.k !== TENSOR) {
    return false;
  }

  for (let i = 0; i < p.tensor.nelem; i++) {
    if (!isZeroAtomOrTensor(p.tensor.elem[i])) {
      return false;
    }
  }
  return true;
}

// this routine is a simple check on whether we have
// a basic zero in our hands. It doesn't perform any
// calculations or simplifications.
export function isZeroAtomOrTensor(p: U): boolean {
  return isZeroAtom(p) || isZeroTensor(p);
}

// This is a key routine to try to determine whether
// the argument looks like zero/false, or non-zero/true,
// or undetermined.
// This is useful in two instances:
//  * to determine if a predicate is true/false
//  * to determine if particular quantity is zero
// Note that if one wants to check if we have a simple
// zero atom or tensor in our hands, then the isZeroAtomOrTensor
// routine is sufficient.
export function isZeroLikeOrNonZeroLikeOrUndetermined(
  valueOrPredicate: U
): boolean | null {
  // push the argument
  push(valueOrPredicate);

  // just like Eval but turns assignments into
  // equality checks
  Eval_predicate();
  let evalledArgument = pop();

  // OK first check if we already have
  // a simple zero (or simple zero tensor)
  if (isZeroAtomOrTensor(evalledArgument)) {
    return false;
  }

  // also check if we have a simple numeric value, or a tensor
  // full of simple numeric values (i.e. straight doubles or fractions).
  // In such cases, since we
  // just excluded they are zero, then we take it as
  // a "true"
  if (isNumericAtomOrTensor(evalledArgument)) {
    return true;
  }

  // if we are here we are in the case of value that
  // is not a zero and not a simple numeric value.
  // e.g. stuff like
  // 'sqrt(2)', or 'sin(45)' or '1+i', or 'a'
  // so in such cases let's try to do a float()
  // so we might get down to a simple numeric value
  // in some of those cases

  push(evalledArgument);
  zzfloat();
  evalledArgument = pop();

  // anything that could be calculated down to a simple
  // numeric value is now indeed either a
  // double OR a double with an imaginary component
  // e.g. 2.0 or 2.4 + i*5.6
  // (Everything else are things that don't have a numeric
  // value e.g. 'a+b')

  // So, let's take care of the case where we have
  // a simple numeric value with NO imaginary component,
  // things like sqrt(2) or sin(PI)
  // by doing the simple numeric
  // values checks again

  if (isZeroAtomOrTensor(evalledArgument)) {
    return false;
  }

  if (isNumericAtomOrTensor(evalledArgument)) {
    return true;
  }

  // here we still have cases of simple numeric values
  // WITH an imaginary component e.g. '1+i',
  // or things that don't have a numeric value e.g. 'a'

  // so now let's take care of the imaginary numbers:
  // since we JUST have to spot "zeros" we can just
  // calculate the absolute value and re-do all the checks
  // we just did

  if (Find(evalledArgument, defs.imaginaryunit)) {
    push(evalledArgument);
    absValFloat();

    Eval_predicate();
    evalledArgument = pop();

    // re-do the simple-number checks...

    if (isZeroAtomOrTensor(evalledArgument)) {
      return false;
    }

    if (isNumericAtomOrTensor(evalledArgument)) {
      return true;
    }
  }

  // here we have stuff that is not reconducible to any
  // numeric value (or tensor with numeric values) e.g.
  // 'a+b', so it just means that we just don't know the
  // truth value, so we have
  // to leave the whole thing unevalled
  return null;
}

export function isnegativenumber(
  p: BaseAtom
): p is (Num | Double) & { __ts_sign: -1 } {
  switch (p.k) {
    case NUM:
      if (MSIGN((p as Num).q.a) === -1) {
        return true;
      }
      break;
    case DOUBLE:
      if ((p as Double).d < 0.0) {
        return true;
      }
      break;
  }
  return false;
}

export function ispositivenumber(
  p: BaseAtom
): p is (Num | Double) & { __ts_sign: 1 } {
  switch (p.k) {
    case NUM:
      if (MSIGN((p as Num).q.a) === 1) {
        return true;
      }
      break;
    case DOUBLE:
      if ((p as Double).d > 0.0) {
        return true;
      }
      break;
  }
  return false;
}

export function isplustwo(
  p: BaseAtom
): p is (Num | Double) & { __ts_sign: 1; __ts_integer: true; __ts_special: 2 } {
  switch (p.k) {
    case NUM:
      if (MEQUAL((p as Num).q.a, 2) && MEQUAL((p as Num).q.b, 1)) {
        return true;
      }
      break;
    case DOUBLE:
      if ((p as Double).d === 2.0) {
        return true;
      }
      break;
  }
  return false;
}

export function isplusone(
  p: BaseAtom
): p is (Num | Double) & { __ts_sign: 1; __ts_integer: true; __ts_special: 1 } {
  switch (p.k) {
    case NUM:
      if (MEQUAL((p as Num).q.a, 1) && MEQUAL((p as Num).q.b, 1)) {
        return true;
      }
      break;
    case DOUBLE:
      if ((p as Double).d === 1.0) {
        return true;
      }
      break;
  }
  return false;
}

export function isminusone(
  p: BaseAtom
): p is (Num | Double) & {
  __ts_sign: -1;
  __ts_integer: true;
  __ts_special: -1;
} {
  switch (p.k) {
    case NUM:
      if (MEQUAL((p as Num).q.a, -1) && MEQUAL((p as Num).q.b, 1)) {
        return true;
      }
      break;
    case DOUBLE:
      if ((p as Double).d === -1.0) {
        return true;
      }
      break;
  }
  return false;
}

export function isone(
  p: BaseAtom
): p is (Num | Double) & {
  __ts_sign: -1 | 1;
  __ts_integer: true;
  __ts_special: 1 | -1;
} {
  return isplusone(p) || isminusone(p);
}

export function isinteger(p: BaseAtom): p is Num & { __ts_integer: true } {
  return p.k === NUM && MEQUAL((p as Num).q.b, 1);
}

export function isintegerorintegerfloat(
  p: BaseAtom
): p is (Num | Double) & { __ts_integer: true } {
  if (p.k === DOUBLE) {
    if ((p as Double).d === Math.round((p as Double).d)) {
      return true;
    }
    return false;
  }
  return isinteger(p);
}

export function isnonnegativeinteger(
  p: BaseAtom
): p is Num & { __ts_integer: true; __ts_sign: 1 } {
  return isrational(p) && MEQUAL(p.q.b, 1) && MSIGN(p.q.a) === 1;
}

export function isposint(
  p: BaseAtom
): p is Num & { __ts_integer: true; __ts_sign: 1 } {
  return isinteger(p) && MSIGN(p.q.a) === 1;
}

// --------------------------------------

export function isunivarpolyfactoredorexpandedform(p: U, x?: U): U | false {
  if (x == null) {
    push(p);
    guess();
    x = pop();
    pop();
  }

  if (
    ispolyfactoredorexpandedform(p, x) &&
    countTrue(
      Find(p, symbol(SYMBOL_X)),
      Find(p, symbol(SYMBOL_Y)),
      Find(p, symbol(SYMBOL_Z))
    ) === 1
  ) {
    return x;
  } else {
    return false;
  }
}

function countTrue(...a: boolean[]): number {
  // Number(true) = 1
  return a.reduce((count, x) => count + Number(x), 0);
}

// --------------------------------------
// sometimes we want to check if we have a poly in our
// hands, however it's in factored form and we don't
// want to expand it.

function ispolyfactoredorexpandedform(p: U, x: U): boolean {
  return ispolyfactoredorexpandedform_factor(p, x);
}

function ispolyfactoredorexpandedform_factor(p: U, x: U): boolean {
  if (car(p) === symbol(MULTIPLY)) {
    p = cdr(p);
    while (iscons(p)) {
      if (DEBUG) {
        console.log('ispolyfactoredorexpandedform_factor testing ' + car(p));
      }
      if (!ispolyfactoredorexpandedform_power(car(p), x)) {
        if (DEBUG) {
          console.log('... tested negative:' + car(p));
        }
        return false;
      }
      p = cdr(p);
    }
    return true;
  } else {
    return ispolyfactoredorexpandedform_power(p, x);
  }
}

function ispolyfactoredorexpandedform_power(p: U, x: U): boolean {
  if (car(p) === symbol(POWER)) {
    if (DEBUG) {
      console.log(
        'ispolyfactoredorexpandedform_power (isposint(caddr(p)) ' +
          (isposint(caddr(p)),
          DEBUG
            ? console.log(
                'ispolyfactoredorexpandedform_power ispolyexpandedform_expr(cadr(p), x)) ' +
                  ispolyexpandedform_expr(cadr(p), x)
              )
            : undefined)
      );
    }
    return isposint(caddr(p)) && ispolyexpandedform_expr(cadr(p), x);
  } else {
    if (DEBUG) {
      console.log(
        'ispolyfactoredorexpandedform_power not a power, testing if this is exp form: ' +
          p
      );
    }
    return ispolyexpandedform_expr(p, x);
  }
}

// --------------------------------------

export function ispolyexpandedform(p: U, x: U): boolean {
  if (Find(p, x)) {
    return ispolyexpandedform_expr(p, x);
  }
  return false;
}

function ispolyexpandedform_expr(p: U, x: U): boolean {
  if (car(p) === symbol(ADD)) {
    p = cdr(p);
    while (iscons(p)) {
      if (!ispolyexpandedform_term(car(p), x)) {
        return false;
      }
      p = cdr(p);
    }
    return true;
  } else {
    return ispolyexpandedform_term(p, x);
  }
}

function ispolyexpandedform_term(p: U, x: U): boolean {
  if (car(p) === symbol(MULTIPLY)) {
    p = cdr(p);
    while (iscons(p)) {
      if (!ispolyexpandedform_factor(car(p), x)) {
        return false;
      }
      p = cdr(p);
    }
    return true;
  } else {
    return ispolyexpandedform_factor(p, x);
  }
}

function ispolyexpandedform_factor(p: U, x: U): boolean {
  if (equal(p, x)) {
    return true;
  }
  if (car(p) === symbol(POWER) && equal(cadr(p), x)) {
    return isposint(caddr(p));
  }
  return !Find(p, x);
}

// --------------------------------------

export function isnegativeterm(p: BaseAtom): boolean {
  if (isnegativenumber(p)) {
    return true;
  } else if (car(p) === symbol(MULTIPLY) && isnegativenumber(cadr(p))) {
    return true;
  } else {
    return false;
  }
}

function hasNegativeRationalExponent(p: BaseAtom): boolean {
  if (
    car(p) === symbol(POWER) &&
    isrational(car(cdr(cdr(p)))) &&
    isnegativenumber(car(cdr(p)))
  ) {
    if (DEBUG_IS) {
      console.log(
        'hasNegativeRationalExponent: ' +
          p.toString() +
          ' has imaginary component'
      );
    }
    return true;
  } else {
    if (DEBUG_IS) {
      console.log(
        'hasNegativeRationalExponent: ' +
          p.toString() +
          ' has NO imaginary component'
      );
    }
    return false;
  }
}

function isimaginarynumberdouble(p: BaseAtom): boolean {
  return (
    (car(p) === symbol(MULTIPLY) &&
      length(p) === 3 &&
      isdouble(cadr(p)) &&
      hasNegativeRationalExponent(caddr(p))) ||
    equal(p as U, defs.imaginaryunit)
  );
}

export function isimaginarynumber(p: BaseAtom): boolean {
  if (
    (car(p) === symbol(MULTIPLY) &&
      length(p) === 3 &&
      isNumericAtom(cadr(p)) &&
      equal(caddr(p), defs.imaginaryunit)) ||
    equal(p as U, defs.imaginaryunit) ||
    hasNegativeRationalExponent(caddr(p))
  ) {
    if (DEBUG_IS) {
      console.log(
        'isimaginarynumber: ' + p.toString() + ' is imaginary number'
      );
    }
    return true;
  } else {
    if (DEBUG_IS) {
      console.log(
        'isimaginarynumber: ' + p.toString() + " isn't an imaginary number"
      );
    }
    return false;
  }
}

export function iscomplexnumberdouble(p: BaseAtom): boolean {
  return (
    (car(p) === symbol(ADD) &&
      length(p) === 3 &&
      isdouble(cadr(p)) &&
      isimaginarynumberdouble(caddr(p))) ||
    isimaginarynumberdouble(p)
  );
}

export function iscomplexnumber(p: U): boolean {
  if (DEBUG_IS) {
    debugger;
  }
  if (
    (car(p) === symbol(ADD) &&
      length(p) === 3 &&
      isNumericAtom(cadr(p)) &&
      isimaginarynumber(caddr(p))) ||
    isimaginarynumber(p)
  ) {
    if (DEBUG) {
      console.log('iscomplexnumber: ' + p.toString() + ' is imaginary number');
    }
    return true;
  } else {
    if (DEBUG) {
      console.log('iscomplexnumber: ' + p.toString() + ' is imaginary number');
    }
    return false;
  }
}

export function iseveninteger(p: U): boolean {
  return isinteger(p) && p.q.a.isEven();
}

export function isnegative(p: U): boolean {
  if (car(p) === symbol(ADD) && isnegativeterm(cadr(p))) {
    return true;
  } else if (isnegativeterm(p)) {
    return true;
  } else {
    return false;
  }
}

// returns 1 if there's a symbol somewhere.
// not used anywhere. Note that PI and POWER are symbols,
// so for example 2^3 would be symbolic
// while -1^(1/2) i.e. 'i' is not, so this can
// be tricky to use.
export function issymbolic(p: U): boolean {
  if (issymbol(p)) {
    return true;
  } else {
    while (iscons(p)) {
      if (issymbolic(car(p))) {
        return true;
      }
      p = cdr(p);
    }
    return false;
  }
}

// i.e. 2, 2^3, etc.
export function isintegerfactor(p: U): boolean {
  return (
    isinteger(p) ||
    (car(p) === symbol(POWER) && isinteger(cadr(p)) && isinteger(caddr(p)))
  );
}

export function isNumberOneOverSomething(p: U): boolean {
  return isfraction(p) && MEQUAL(p.q.a.abs(), 1);
}

export function isoneover(p: U): boolean {
  return car(p) === symbol(POWER) && isminusone(caddr(p));
}

export function isfraction(p: BaseAtom): p is Num {
  return p.k === NUM && !MEQUAL((p as Num).q.b, 1);
}

// n an int
export function equaln(p: U, n: number): boolean {
  switch (p.k) {
    case NUM:
      if (MEQUAL(p.q.a, n) && MEQUAL(p.q.b, 1)) {
        return true;
      }
      break;
    case DOUBLE:
      if (p.d === n) {
        return true;
      }
      break;
  }
  return false;
}

// a and b ints
export function equalq(p: U, a: number, b: number): boolean {
  switch (p.k) {
    case NUM:
      if (MEQUAL(p.q.a, a) && MEQUAL(p.q.b, b)) {
        return true;
      }
      break;
    case DOUBLE:
      if (p.d === a / b) {
        return true;
      }
      break;
  }
  return false;
}

// p == 1/2 ?
export function isoneovertwo(p: BaseAtom): boolean {
  return equalq(p as U, 1, 2);
}

// p == -1/2 ?
export function isminusoneovertwo(p: BaseAtom): boolean {
  return equalq(p as U, -1, 2);
}

// p == 1/sqrt(2) ?
export function isoneoversqrttwo(p: BaseAtom): boolean {
  return (
    car(p) === symbol(POWER) && equaln(cadr(p), 2) && equalq(caddr(p), -1, 2)
  );
}

// p == -1/sqrt(2) ?
export function isminusoneoversqrttwo(p: BaseAtom): boolean {
  return (
    car(p) === symbol(MULTIPLY) &&
    equaln(cadr(p), -1) &&
    isoneoversqrttwo(caddr(p)) &&
    length(p) === 3
  );
}

// Check if the value is sqrt(3)/2
export function isSqrtThreeOverTwo(p: BaseAtom): boolean {
  return (
    car(p) === symbol(MULTIPLY) &&
    isoneovertwo(cadr(p)) &&
    isSqrtThree(caddr(p)) &&
    length(p) === 3
  );
}

// Check if the value is -sqrt(3)/2
export function isMinusSqrtThreeOverTwo(p: BaseAtom): boolean {
  return (
    car(p) === symbol(MULTIPLY) &&
    isminusoneovertwo(cadr(p)) &&
    isSqrtThree(caddr(p)) &&
    length(p) === 3
  );
}

// Check if value is sqrt(3)
function isSqrtThree(p: BaseAtom): boolean {
  return (
    car(p) === symbol(POWER) && equaln(cadr(p), 3) && isoneovertwo(caddr(p))
  );
}

export function isfloating(p: BaseAtom): boolean {
  if (p.k === DOUBLE || p === symbol(FLOATF)) {
    return true;
  }
  while (iscons(p)) {
    if (isfloating(car(p))) {
      return true;
    }
    p = cdr(p);
  }
  return false;
}

export function isimaginaryunit(p: U): boolean {
  return equal(p, defs.imaginaryunit);
}

// n/2 * i * pi ?
// return value:
//  0  no
//  1  1
//  2  -1
//  3  i
//  4  -i
export function isquarterturn(p: U): 0 | 1 | 2 | 3 | 4 {
  let n = 0;
  let minussign = 0;

  if (car(p) !== symbol(MULTIPLY)) {
    return 0;
  }

  if (equal(cadr(p), defs.imaginaryunit)) {
    if (caddr(p) !== symbol(PI)) {
      return 0;
    }

    if (length(p) !== 3) {
      return 0;
    }

    return 2;
  }

  if (!isNumericAtom(cadr(p))) {
    return 0;
  }

  if (!equal(caddr(p), defs.imaginaryunit)) {
    return 0;
  }

  if (cadddr(p) !== symbol(PI)) {
    return 0;
  }

  if (length(p) !== 4) {
    return 0;
  }

  push(cadr(p));
  push_integer(2);
  multiply();

  n = pop_integer();

  if (isNaN(n)) {
    return 0;
  }

  if (n < 1) {
    minussign = 1;
    n = -n;
  }

  switch (n % 4) {
    case 0:
      n = 1;
      break;
    case 1:
      if (minussign) {
        n = 4;
      } else {
        n = 3;
      }
      break;
    case 2:
      n = 2;
      break;
    case 3:
      if (minussign) {
        n = 3;
      } else {
        n = 4;
      }
      break;
  }

  return n as 0 | 1 | 2 | 3 | 4;
}

// special multiple of pi?
// returns for the following multiples of pi...
//  -4/2  -3/2  -2/2  -1/2  1/2  2/2  3/2  4/2
//  4  1  2  3  1  2  3  4
export function isnpi(p: U) {
  let n = 0;
  if (p === symbol(PI)) {
    return 2;
  }
  if (
    car(p) === symbol(MULTIPLY) &&
    isNumericAtom(cadr(p)) &&
    caddr(p) === symbol(PI) &&
    length(p) === 3
  ) {
    // do nothing
  } else {
    return 0;
  }
  push(cadr(p));
  push_integer(2);
  multiply();
  n = pop_integer();
  if (isNaN(n)) {
    return 0;
  }
  if (n < 0) {
    n = 4 - (-n % 4);
  } else {
    n = 1 + ((n - 1) % 4);
  }
  return n;
}
