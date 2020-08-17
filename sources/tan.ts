import {
  ARCTAN,
  cadr,
  car,
  defs,
  isdouble,
  PI,
  symbol,
  TAN,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import {
  pop_integer,
  push_double,
  push_integer,
  push_rational,
} from './bignum';
import { Eval } from './eval';
import { isnegative } from './is';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
// Tangent function of numerical and symbolic arguments
export function Eval_tan(p1: U) {
  push(cadr(p1));
  Eval();
  tangent();
}

function tangent() {
  yytangent();
}

function yytangent() {
  const p1 = pop();

  if (car(p1) === symbol(ARCTAN)) {
    push(cadr(p1));
    return;
  }

  if (isdouble(p1)) {
    let d = Math.tan(p1.d);
    if (Math.abs(d) < 1e-10) {
      d = 0.0;
    }
    push_double(d);
    return;
  }

  // tan function is antisymmetric, tan(-x) = -tan(x)
  if (isnegative(p1)) {
    push(p1);
    negate();
    tangent();
    negate();
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
    push(symbol(TAN));
    push(p1);
    list(2);
    return;
  }

  switch (n % 360) {
    case 0:
    case 180:
      return push_integer(0);
    case 30:
    case 210:
      push_rational(1, 3);
      push_integer(3);
      push_rational(1, 2);
      power();
      return multiply();
    case 150:
    case 330:
      push_rational(-1, 3);
      push_integer(3);
      push_rational(1, 2);
      power();
      return multiply();
    case 45:
    case 225:
      return push_integer(1);
    case 135:
    case 315:
      return push_integer(-1);
    case 60:
    case 240:
      push_integer(3);
      push_rational(1, 2);
      return power();
    case 120:
    case 300:
      push_integer(3);
      push_rational(1, 2);
      power();
      return negate();
    default:
      push(symbol(TAN));
      push(p1);
      return list(2);
  }
}
