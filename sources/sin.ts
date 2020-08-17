import {
  ADD,
  ARCSIN,
  ARCTAN,
  cadr,
  car,
  cdr,
  defs,
  iscons,
  isdouble,
  PI,
  SIN,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import {
  pop_integer,
  push_double,
  push_integer,
  push_rational,
} from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { isnegative, isnpi } from './is';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
// Sine function of numerical and symbolic arguments
export function Eval_sin(p1: U) {
  //console.log "sin ---- "
  push(cadr(p1));
  Eval();
  sine();
}
//console.log "sin end ---- "

export function sine() {
  const p1 = pop();
  if (car(p1) === symbol(ADD)) {
    // sin of a sum can be further decomposed into
    //sin(alpha+beta) = sin(alpha)*cos(beta)+sin(beta)*cos(alpha)
    sine_of_angle_sum(p1);
  } else {
    sine_of_angle(p1);
  }
}
//console.log "sine end ---- "

// Use angle sum formula for special angles.

// decompose sum sin(alpha+beta) into
// sin(alpha)*cos(beta)+sin(beta)*cos(alpha)
function sine_of_angle_sum(p1: U) {
  //console.log "sin of angle sum ---- "
  let p2 = cdr(p1);
  while (iscons(p2)) {
    const B = car(p2);
    if (isnpi(B)) {
      push(p1);
      push(B);
      subtract();
      const A = pop();
      push(A);
      sine();
      push(B);
      cosine();
      multiply();
      push(A);
      cosine();
      push(B);
      sine();
      multiply();
      add();
      //console.log "sin of angle sum end ---- "
      return;
    }
    p2 = cdr(p2);
  }
  sine_of_angle(p1);
}
//console.log "sin of angle sum end ---- "

function sine_of_angle(p1: U) {
  if (car(p1) === symbol(ARCSIN)) {
    push(cadr(p1));
    return;
  }

  if (isdouble(p1)) {
    let d = Math.sin(p1.d);
    if (Math.abs(d) < 1e-10) {
      d = 0.0;
    }
    push_double(d);
    return;
  }

  // sine function is antisymmetric, sin(-x) = -sin(x)
  if (isnegative(p1)) {
    push(p1);
    negate();
    sine();
    negate();
    return;
  }

  // sin(arctan(x)) = x / sqrt(1 + x^2)

  // see p. 173 of the CRC Handbook of Mathematical Sciences
  if (car(p1) === symbol(ARCTAN)) {
    push(cadr(p1));
    push_integer(1);
    push(cadr(p1));
    push_integer(2);
    power();
    add();
    push_rational(-1, 2);
    power();
    multiply();
    return;
  }

  // multiply by 180/pi to go from radians to degrees.
  // we go from radians to degrees because it's much
  // easier to calculate symbolic results of most (not all) "classic"
  // angles (e.g. 30,45,60...) if we calculate the degrees
  // and the we do a switch on that.
  // Alternatively, we could look at the fraction of pi
  // (e.g. 60 degrees is 1/3 pi) but that's more
  // convoluted as we'd need to look at both numerator and
  // denominator.
  push(p1);
  push_integer(180);
  multiply();
  if (defs.evaluatingAsFloats) {
    push_double(Math.PI);
  } else {
    push_symbol(PI);
  }
  divide();

  const n = pop_integer();

  // most "good" (i.e. compact) trigonometric results
  // happen for a round number of degrees. There are some exceptions
  // though, e.g. 22.5 degrees, which we don't capture here.
  if (n < 0 || isNaN(n)) {
    push(symbol(SIN));
    push(p1);
    list(2);
    return;
  }

  // values of some famous angles. Many more here:
  // https://en.wikipedia.org/wiki/Trigonometric_constants_expressed_in_real_radicals
  switch (n % 360) {
    case 0:
    case 180:
      return push_integer(0);
    case 30:
    case 150:
      return push_rational(1, 2);
    case 210:
    case 330:
      return push_rational(-1, 2);
    case 45:
    case 135:
      push_rational(1, 2);
      push_integer(2);
      push_rational(1, 2);
      power();
      return multiply();
    case 225:
    case 315:
      push_rational(-1, 2);
      push_integer(2);
      push_rational(1, 2);
      power();
      return multiply();
    case 60:
    case 120:
      push_rational(1, 2);
      push_integer(3);
      push_rational(1, 2);
      power();
      return multiply();
    case 240:
    case 300:
      push_rational(-1, 2);
      push_integer(3);
      push_rational(1, 2);
      power();
      return multiply();
    case 90:
      return push_integer(1);
    case 270:
      return push_integer(-1);
    default:
      push(symbol(SIN));
      push(p1);
      return list(2);
  }
}
