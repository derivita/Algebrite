import { lcm } from './lcm';
import { DEBUG, defs, issymbol, U } from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { moveTos, pop, push } from '../runtime/stack';
import { equal } from '../sources/misc';
import { add, subtract } from './add';
import { push_integer, push_rational } from './bignum';
import { coeff } from './coeff';
import { yycondense } from './condense';
import { conjugate } from './conj';
import { denominator } from './denominator';
import { divisors_onstack } from './divisors';
import {
  isfloating,
  isnegativeterm,
  ispolyexpandedform,
  isZeroAtomOrTensor,
} from './is';
import {
  divide,
  multiply,
  multiply_noexpand,
  negate,
  negate_noexpand,
  reciprocate,
} from './multiply';
import { power } from './power';
import { print_list } from './print';
import { divpoly } from './quotient';
import { rect } from './rect';
// Factor a polynomial

//define POLY p1
//define X p2
//define Z p3
//define A p4
//define B p5
//define Q p6
//define RESULT p7
//define FACTOR p8

let polycoeff = 0;
let factpoly_expo = 0;

export function factorpoly() {
  const X = pop();
  const POLY = pop();

  if (!Find(POLY, X)) {
    push(POLY);
    return;
  }

  if (!ispolyexpandedform(POLY, X)) {
    push(POLY);
    return;
  }

  if (!issymbol(X)) {
    push(POLY);
    return;
  }

  push(POLY);
  push(X);
  yyfactorpoly();
}

//-----------------------------------------------------------------------------
//
//  Input:    tos-2    true polynomial
//
//      tos-1    free variable
//
//  Output:    factored polynomial on stack
//
//-----------------------------------------------------------------------------
function yyfactorpoly() {
  let p7: U, p4: U, p5: U, p8: U;
  let prev_expanding: number;

  const p2 = pop();
  let p1 = pop();

  const h = defs.tos;

  if (isfloating(p1)) {
    stop('floating point numbers in polynomial');
  }

  polycoeff = defs.tos;

  push(p1);
  push(p2);
  factpoly_expo = coeff() - 1;

  [p7] = rationalize_coefficients(h);

  // for univariate polynomials we could do factpoly_expo > 1
  let whichRootsAreWeFinding = 'real';
  let remainingPoly: U = null;
  while (factpoly_expo > 0) {
    var foundComplexRoot: boolean, foundRealRoot: boolean;
    if (isZeroAtomOrTensor(defs.stack[polycoeff + 0])) {
      push_integer(1);
      p4 = pop();
      push_integer(0);
      p5 = pop();
    } else {
      //console.log("trying to find a " + whichRootsAreWeFinding + " root")
      if (whichRootsAreWeFinding === 'real') {
        [foundRealRoot, p4, p5] = get_factor_from_real_root(p2, p4, p5);
      } else if (whichRootsAreWeFinding === 'complex') {
        [foundComplexRoot, p4] = get_factor_from_complex_root(remainingPoly);
      }
    }

    if (whichRootsAreWeFinding === 'real') {
      if (foundRealRoot === false) {
        whichRootsAreWeFinding = 'complex';
        continue;
      } else {
        push(p4); // A
        push(p2); // x
        multiply();
        push(p5); // B
        add();
        p8 = pop();

        if (DEBUG) {
          console.log('success\nFACTOR=' + p8);
        }

        // factor out negative sign (not req'd because p4 > 1)
        //if 0
        /*
        if (isnegativeterm(p4))
          push(p8)
          negate()
          p8 = pop()
          push(p7)
          negate_noexpand()
          p7 = pop()
        */
        //endif

        // p7 is the part of the polynomial that was factored so far,
        // add the newly found factor to it. Note that we are not actually
        // multiplying the polynomials fully, we are just leaving them
        // expressed as (P1)*(P2), we are not expanding the product.
        push(p7);
        push(p8);
        multiply_noexpand();
        p7 = pop();

        // ok now on stack we have the coefficients of the
        // remaining part of the polynomial still to factor.
        // Divide it by the newly-found factor so that
        // the stack then contains the coefficients of the
        // polynomial part still left to factor.
        yydivpoly(p4, p5);

        while (
          factpoly_expo &&
          isZeroAtomOrTensor(defs.stack[polycoeff + factpoly_expo])
        ) {
          factpoly_expo--;
        }

        push(defs.zero);
        for (let i = 0; i <= factpoly_expo; i++) {
          push(defs.stack[polycoeff + i]);
          push(p2); // the free variable
          push_integer(i);
          power();
          multiply();
          add();
        }
        remainingPoly = pop();
      }
      //console.log("real branch remainingPoly: " + remainingPoly)
    } else if (whichRootsAreWeFinding === 'complex') {
      if (foundComplexRoot === false) {
        break;
      } else {
        push(p4); // A
        push(p2); // x
        subtract();
        //console.log("first factor: " + stack[tos-1].toString())

        push(p4); // A
        conjugate();
        push(p2); // x
        subtract();
        //console.log("second factor: " + stack[tos-1].toString())

        multiply();

        //if (factpoly_expo > 0 && isnegativeterm(stack[polycoeff+factpoly_expo]))
        //  negate()
        //  negate_noexpand()

        p8 = pop();

        if (DEBUG) {
          console.log('success\nFACTOR=' + p8);
        }

        // factor out negative sign (not req'd because p4 > 1)
        //if 0
        /*
        if (isnegativeterm(p4))
          push(p8)
          negate()
          p8 = pop()
          push(p7)
          negate_noexpand()
          p7 = pop()
        */
        //endif

        // p7 is the part of the polynomial that was factored so far,
        // add the newly found factor to it. Note that we are not actually
        // multiplying the polynomials fully, we are just leaving them
        // expressed as (P1)*(P2), we are not expanding the product.

        push(p7);
        const previousFactorisation = pop();

        //console.log("previousFactorisation: " + previousFactorisation)

        push(p7);
        push(p8);
        multiply_noexpand();
        p7 = pop();

        //console.log("new prospective factorisation: " + p7)

        // build the polynomial of the unfactored part
        //console.log("build the polynomial of the unfactored part factpoly_expo: " + factpoly_expo)

        if (remainingPoly == null) {
          push(defs.zero);
          for (let i = 0; i <= factpoly_expo; i++) {
            push(defs.stack[polycoeff + i]);
            push(p2); // the free variable
            push_integer(i);
            power();
            multiply();
            add();
          }
          remainingPoly = pop();
        }
        //console.log("original polynomial (dividend): " + remainingPoly)

        const dividend = remainingPoly;
        //push(dividend)
        //degree()
        //startingDegree = pop()
        push(dividend);

        //console.log("dividing " + stack[tos-1].toString() + " by " + p8)
        push(p8); // divisor
        push(p2); // X
        divpoly();
        remainingPoly = pop();

        push(remainingPoly);
        push(p8); // divisor
        multiply();
        const checkingTheDivision = pop();

        if (!equal(checkingTheDivision, dividend)) {
          //push(dividend)
          //gcd_sum()
          //console.log("gcd top of stack: " + stack[tos-1].toString())

          if (DEBUG) {
            console.log(
              "we found a polynomial based on complex root and its conj but it doesn't divide the poly, quitting"
            );
          }
          if (DEBUG) {
            console.log(
              'so just returning previousFactorisation times dividend: ' +
                previousFactorisation +
                ' * ' +
                dividend
            );
          }
          push(previousFactorisation);
          push(dividend);

          prev_expanding = defs.expanding;
          defs.expanding = 0;
          yycondense();
          defs.expanding = prev_expanding;

          multiply_noexpand();
          p7 = pop();
          defs.stack[h] = p7;
          moveTos(h + 1);
          return;
        }

        //console.log("result: (still to be factored) " + remainingPoly)

        //push(remainingPoly)
        //degree()
        //remainingDegree = pop()

        /*
        if compare_numbers(startingDegree, remainingDegree)
          * ok even if we found a complex root that
          * together with the conjugate generates a poly in Z,
          * that doesn't mean that the division would end up in Z.
          * Example: 1+x^2+x^4+x^6 has +i and -i as one of its roots
          * so a factor is 1+x^2 ( = (x+i)*(x-i))
          * BUT 
        */
        for (let i = 0; i <= factpoly_expo; i++) {
          pop();
        }

        push(remainingPoly);
        push(p2);
        coeff();

        factpoly_expo -= 2;
      }
    }
  }
  //console.log("factpoly_expo: " + factpoly_expo)

  // build the remaining unfactored part of the polynomial

  push(defs.zero);
  for (let i = 0; i <= factpoly_expo; i++) {
    push(defs.stack[polycoeff + i]);
    push(p2); // the free variable
    push_integer(i);
    power();
    multiply();
    add();
  }
  p1 = pop();

  if (DEBUG) {
    console.log('POLY=' + p1);
  }

  push(p1);

  prev_expanding = defs.expanding;
  defs.expanding = 0;
  yycondense();
  defs.expanding = prev_expanding;

  p1 = pop();
  //console.log("new poly with extracted common factor: " + p1)
  //debugger

  // factor out negative sign

  if (
    factpoly_expo > 0 &&
    isnegativeterm(defs.stack[polycoeff + factpoly_expo])
  ) {
    push(p1);
    //prev_expanding = expanding
    //expanding = 1
    negate();
    //expanding = prev_expanding
    p1 = pop();
    push(p7);
    negate_noexpand();
    p7 = pop();
  }

  push(p7);
  push(p1);
  multiply_noexpand();
  p7 = pop();

  if (DEBUG) {
    console.log('RESULT=' + p7);
  }

  defs.stack[h] = p7;

  moveTos(h + 1);
}

function rationalize_coefficients(h: number): [U] {
  // LCM of all polynomial coefficients
  let p7: U = defs.one;
  for (let i = h; i < defs.tos; i++) {
    push(defs.stack[i]);
    denominator();
    push(p7);
    lcm();
    p7 = pop();
  }

  // multiply each coefficient by RESULT
  for (let i = h; i < defs.tos; i++) {
    push(p7);
    push(defs.stack[i]);
    multiply();
    defs.stack[i] = pop();
  }

  // reciprocate RESULT
  push(p7);
  reciprocate();
  p7 = pop();
  if (DEBUG) {
    console.log('rationalize_coefficients result');
  }
  return [p7];
}
//console.log print_list(p7)

function get_factor_from_real_root(p2: U, p4: U, p5: U): [boolean, U, U] {
  let p1: U, p3: U, p6: U;

  if (DEBUG) {
    push(defs.zero);
    for (let i = 0; i <= factpoly_expo; i++) {
      push(defs.stack[polycoeff + i]);
      push(p2);
      push_integer(i);
      power();
      multiply();
      add();
    }
    p1 = pop();
    console.log('POLY=' + p1);
  }

  const h = defs.tos;

  const an = defs.tos;
  push(defs.stack[polycoeff + factpoly_expo]);

  divisors_onstack();

  const nan = defs.tos - an;

  const a0 = defs.tos;
  push(defs.stack[polycoeff + 0]);
  divisors_onstack();
  const na0 = defs.tos - a0;

  if (DEBUG) {
    console.log('divisors of base term');
    for (let i = 0; i < na0; i++) {
      console.log(', ' + defs.stack[a0 + i]);
    }
    console.log('divisors of leading term');
    for (let i = 0; i < nan; i++) {
      console.log(', ' + defs.stack[an + i]);
    }
  }

  // try roots
  for (let rootsTries_i = 0; rootsTries_i < nan; rootsTries_i++) {
    for (let rootsTries_j = 0; rootsTries_j < na0; rootsTries_j++) {
      //if DEBUG then console.log "nan: " + nan + " na0: " + na0 + " i: " + rootsTries_i + " j: " + rootsTries_j
      p4 = defs.stack[an + rootsTries_i];
      p5 = defs.stack[a0 + rootsTries_j];

      push(p5);
      push(p4);
      divide();
      negate();
      p3 = pop();

      [p6] = Evalpoly(p3);

      if (DEBUG) {
        console.log('try A=' + p4);
        console.log(', B=' + p5);
        console.log(', root ' + p2);
        console.log('=-B/A=' + p3);
        console.log(', POLY(' + p3);
        console.log(')=' + p6);
      }

      if (isZeroAtomOrTensor(p6)) {
        moveTos(h);
        if (DEBUG) {
          console.log('get_factor_from_real_root returning true');
        }
        return [true, p4, p5];
      }

      push(p5);
      negate();
      p5 = pop();

      push(p3);
      negate();
      p3 = pop();

      [p6] = Evalpoly(p3);

      if (DEBUG) {
        console.log('try A=' + p4);
        console.log(', B=' + p5);
        console.log(', root ' + p2);
        console.log('=-B/A=' + p3);
        console.log(', POLY(' + p3);
        console.log(')=' + p6);
      }

      if (isZeroAtomOrTensor(p6)) {
        moveTos(h);
        if (DEBUG) {
          console.log('get_factor_from_real_root returning true');
        }
        return [true, p4, p5];
      }
    }
  }

  moveTos(h);

  if (DEBUG) {
    console.log('get_factor_from_real_root returning false');
  }
  return [false, p4, p5];
}

function get_factor_from_complex_root(remainingPoly: U): [boolean, U] {
  let p1: U, p4: U, p3: U, p6: U;

  if (factpoly_expo <= 2) {
    if (DEBUG) {
      console.log(
        'no more factoring via complex roots to be found in polynomial of degree <= 2'
      );
    }
    return [false, p4];
  }

  p1 = remainingPoly;
  if (DEBUG) {
    console.log('complex root finding for POLY=' + p1);
  }

  const h = defs.tos;

  // trying -1^(2/3) which generates a polynomial in Z
  // generates x^2 + 2x + 1
  push_integer(-1);
  push_rational(2, 3);
  power();
  rect();
  p4 = pop();
  if (DEBUG) {
    console.log('complex root finding: trying with ' + p4);
  }
  push(p4);
  p3 = pop();
  push(p3);
  [p6] = Evalpoly(p3);
  if (DEBUG) {
    console.log('complex root finding result: ' + p6);
  }
  if (isZeroAtomOrTensor(p6)) {
    moveTos(h);
    if (DEBUG) {
      console.log('get_factor_from_complex_root returning true');
    }
    return [true, p4];
  }

  // trying 1^(2/3) which generates a polynomial in Z
  // http://www.wolframalpha.com/input/?i=(1)%5E(2%2F3)
  // generates x^2 - 2x + 1
  push_integer(1);
  push_rational(2, 3);
  power();
  rect();
  p4 = pop();
  if (DEBUG) {
    console.log('complex root finding: trying with ' + p4);
  }
  push(p4);
  p3 = pop();
  push(p3);
  [p6] = Evalpoly(p3);
  if (DEBUG) {
    console.log('complex root finding result: ' + p6);
  }
  if (isZeroAtomOrTensor(p6)) {
    moveTos(h);
    if (DEBUG) {
      console.log('get_factor_from_complex_root returning true');
    }
    return [true, p4];
  }

  // trying some simple complex numbers. All of these
  // generate polynomials in Z
  for (let rootsTries_i = -10; rootsTries_i <= 10; rootsTries_i++) {
    for (let rootsTries_j = 1; rootsTries_j <= 5; rootsTries_j++) {
      push_integer(rootsTries_i);
      push_integer(rootsTries_j);
      push(defs.imaginaryunit);
      multiply();
      add();
      rect();
      p4 = pop();
      //console.log("complex root finding: trying simple complex combination: " + p4)

      push(p4);
      const p3 = pop();

      push(p3);

      const [p6] = Evalpoly(p3);

      //console.log("complex root finding result: " + p6)
      if (isZeroAtomOrTensor(p6)) {
        moveTos(h);
        if (DEBUG) {
          console.log('found complex root: ' + p6);
        }
        return [true, p4];
      }
    }
  }

  moveTos(h);

  if (DEBUG) {
    console.log('get_factor_from_complex_root returning false');
  }
  return [false, p4];
}

//-----------------------------------------------------------------------------
//
//  Divide a polynomial by Ax+B
//
//  Input:  on stack:  polycoeff  Dividend coefficients
//
//      factpoly_expo    Degree of dividend
//
//      A (p4)    As above
//
//      B (p5)    As above
//
//  Output:   on stack: polycoeff  Contains quotient coefficients
//
//-----------------------------------------------------------------------------
function yydivpoly(p4: U, p5: U) {
  let p6: U = defs.zero;
  for (let i = factpoly_expo; i > 0; i--) {
    push(defs.stack[polycoeff + i]);
    defs.stack[polycoeff + i] = p6;
    push(p4);
    divide();
    p6 = pop();
    push(defs.stack[polycoeff + i - 1]);
    push(p6);
    push(p5);
    multiply();
    subtract();
    defs.stack[polycoeff + i - 1] = pop();
  }
  defs.stack[polycoeff + 0] = p6;
  if (DEBUG) {
    console.log('yydivpoly Q:');
  }
}
//console.log print_list(p6)

function Evalpoly(p3: U): [U] {
  push(defs.zero);
  for (let i = factpoly_expo; i >= 0; i--) {
    push(p3);
    multiply();
    push(defs.stack[polycoeff + i]);
    if (DEBUG) {
      console.log('Evalpoly top of stack:');
      console.log(print_list(defs.stack[defs.tos - i]));
    }
    add();
  }
  const p6 = pop();
  return [p6];
}
