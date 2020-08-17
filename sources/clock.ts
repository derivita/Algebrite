import { cadr, defs, PI, POWER, symbol, U } from '../runtime/defs';
import { pop, push, top } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { abs } from './abs';
import { arg } from './arg';
import { push_double, push_integer } from './bignum';
import { Eval } from './eval';
import { list } from './list';
import { divide, multiply } from './multiply';
/*
 Convert complex z to clock form

  Input:    push  z

  Output:    Result on stack

  clock(z) = abs(z) * (-1) ^ (arg(z) / pi)

  For example, clock(exp(i pi/3)) gives the result (-1)^(1/3)
*/

// P.S. I couldn't find independent definition/aknowledgment
// of the naming "clock form" anywhere on the web, seems like a
// naming specific to eigenmath.
// Clock form is another way to express a complex number, and
// it has three advantages
//   1) it's uniform with how for example
//      i is expressed i.e. (-1)^(1/2)
//   2) it's very compact
//   3) it's a straighforward notation for roots of 1 and -1

const DEBUG_CLOCKFORM = false;

export function Eval_clock(p1: U) {
  push(cadr(p1));
  Eval();
  clockform();
}

export function clockform() {
  //if 1
  const p1 = pop();
  push(p1);
  abs();
  if (DEBUG_CLOCKFORM) {
    console.log('clockform: abs of ' + p1 + ' : ' + top());
  }

  // pushing the expression (-1)^... but note
  // that we can't use "power", as "power" evaluates
  // clock forms into rectangular form (see "-1 ^ rational"
  // section in power)
  push_symbol(POWER);

  push_integer(-1);

  push(p1);
  arg();
  if (DEBUG_CLOCKFORM) {
    console.log('clockform: arg of ' + p1 + ' : ' + top());
  }
  if (defs.evaluatingAsFloats) {
    push_double(Math.PI);
  } else {
    push(symbol(PI));
  }
  divide();
  if (DEBUG_CLOCKFORM) {
    console.log('clockform: divide : ' + top());
  }
  list(3);

  if (DEBUG_CLOCKFORM) {
    console.log('clockform: power : ' + top());
  }
  multiply();
  if (DEBUG_CLOCKFORM) {
    console.log('clockform: multiply : ' + top());
  }
}
