import {
  ADD,
  ARG,
  ASSUME_REAL_VARIABLES,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  E,
  iscons,
  isdouble,
  issymbol,
  MULTIPLY,
  PI,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push, top } from '../runtime/stack';
import { get_binding, push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { arctan } from './arctan';
import { push_double, push_integer } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { imag } from './imag';
import {
  equaln,
  isnegative,
  isnegativenumber,
  isoneovertwo,
  ispositivenumber,
  isZeroAtomOrTensor,
} from './is';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { numerator } from './numerator';
import { real } from './real';
import { rect } from './rect';
/* arg =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
z

General description
-------------------
Returns the angle of complex z.

*/

/*
 Argument (angle) of complex z

  z    arg(z)
  -    ------

  a    0

  -a    -pi      See note 3 below

  (-1)^a    a pi

  exp(a + i b)  b

  a b    arg(a) + arg(b)

  a + i b    arctan(b/a)

Result by quadrant

  z    arg(z)
  -    ------

  1 + i    1/4 pi

  1 - i    -1/4 pi

  -1 + i    3/4 pi

  -1 - i    -3/4 pi

Notes

  1. Handles mixed polar and rectangular forms, e.g. 1 + exp(i pi/3)

  2. Symbols in z are assumed to be positive and real.

  3. Negative direction adds -pi to angle.

     Example: z = (-1)^(1/3), abs(z) = 1/3 pi, abs(-z) = -2/3 pi

  4. jean-francois.debroux reports that when z=(a+i*b)/(c+i*d) then

    arg(numerator(z)) - arg(denominator(z))

     must be used to get the correct answer. Now the operation is
     automatic.
*/

const DEBUG_ARG = false;

export function Eval_arg(z: U) {
  push(cadr(z));
  Eval();
  arg();
}

export function arg() {
  const z: U = pop();
  push(z);
  numerator();
  yyarg();
  push(z);
  denominator();
  yyarg();
  subtract();
}

function yyarg() {
  let p1: U = pop();

  // case of plain number
  if (ispositivenumber(p1) || p1 === symbol(PI)) {
    if (isdouble(p1) || defs.evaluatingAsFloats) {
      push_double(0);
    } else {
      push_integer(0);
    }
  } else if (isnegativenumber(p1)) {
    if (isdouble(p1) || defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push(symbol(PI));
    }
    negate();

    // you'd think that something like
    // arg(a) is always 0 when a is real but no,
    // arg(a) is pi when a is negative so we have
    // to leave unexpressed
  } else if (issymbol(p1)) {
    push_symbol(ARG);
    push(p1);
    list(2);
  } else if (car(p1) === symbol(POWER) && equaln(cadr(p1), -1)) {
    // -1 to a power
    if (defs.evaluatingAsFloats) {
      push_double(Math.PI);
    } else {
      push(symbol(PI));
    }
    push(caddr(p1));
    multiply();
  } else if (car(p1) === symbol(POWER) && cadr(p1) === symbol(E)) {
    // exponential
    push(caddr(p1));
    imag();
    // arg(a^(1/2)) is always equal to 1/2 * arg(a)
    // this can obviously be made more generic TODO
  } else if (car(p1) === symbol(POWER) && isoneovertwo(caddr(p1))) {
    if (DEBUG_ARG) {
      console.log('arg of a sqrt: ' + p1);
    }
    if (DEBUG_ARG) {
      debugger;
    }
    push(cadr(p1));
    arg();
    if (DEBUG_ARG) {
      console.log(' = 1/2 * ' + top());
    }
    push(caddr(p1));
    multiply();
  } else if (car(p1) === symbol(MULTIPLY)) {
    // product of factors
    push_integer(0);
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      arg();
      add();
      p1 = cdr(p1);
    }
  } else if (car(p1) === symbol(ADD)) {
    // sum of terms
    push(p1);
    rect();
    p1 = pop();
    push(p1);
    real();
    let RE = pop();
    push(p1);
    imag();
    let IM = pop();
    if (isZeroAtomOrTensor(RE)) {
      if (defs.evaluatingAsFloats) {
        push_double(Math.PI);
      } else {
        push(symbol(PI));
      }
      if (isnegative(IM)) {
        negate();
      }
    } else {
      push(IM);
      push(RE);
      divide();
      arctan();
      if (isnegative(RE)) {
        if (defs.evaluatingAsFloats) {
          push_double(Math.PI);
        } else {
          push_symbol(PI);
        }
        if (isnegative(IM)) {
          subtract(); // quadrant 1 -> 3
        } else {
          add(); // quadrant 4 -> 2
        }
      }
    }
  } else {
    if (!isZeroAtomOrTensor(get_binding(symbol(ASSUME_REAL_VARIABLES)))) {
      // if we assume all passed values are real
      push_integer(0);
    } else {
      // if we don't assume all passed values are real, all
      // we con do is to leave unexpressed
      push_symbol(ARG);
      push(p1);
      list(2);
    }
  }
}
