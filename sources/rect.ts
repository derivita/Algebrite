import {
  ADD,
  ASSUME_REAL_VARIABLES,
  cadr,
  car,
  cdr,
  COS,
  defs,
  iscons,
  issymbol,
  MULTIPLY,
  SIN,
  symbol,
  U,
  YYRECT,
} from '../runtime/defs';
import {
  Find,
  findPossibleClockForm,
  findPossibleExponentialForm,
} from '../runtime/find';
import { pop, push, top } from '../runtime/stack';
import { get_binding, push_symbol } from '../runtime/symbol';
import { abs } from './abs';
import { add } from './add';
import { arg } from './arg';
import { push_integer } from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { isimaginaryunit, isZeroAtomOrTensor } from './is';
import { list } from './list';
import { multiply } from './multiply';
import { sine } from './sin';
/*
Convert complex z to rectangular form

  Input:    push  z

  Output:    Result on stack
*/
const DEBUG_RECT = false;

export function Eval_rect(p1: U) {
  push(cadr(p1));
  Eval();
  rect();
}

export function rect() {
  let p1 = pop();
  const input = p1;

  if (DEBUG_RECT) {
    console.log('RECT of ' + input);
  }

  if (DEBUG_RECT) {
    console.log(
      'any clock forms in : ' + input + ' ? ' + findPossibleClockForm(input, p1)
    );
  }

  // if we assume real variables, then the
  // rect of any symbol is the symbol itself
  // (note that 'i' is not a symbol, it's made of (-1)^(1/2))
  // otherwise we have to leave unevalled
  if (issymbol(p1)) {
    if (DEBUG_RECT) {
      console.log(' rect: simple symbol: ' + input);
    }
    if (!isZeroAtomOrTensor(get_binding(symbol(ASSUME_REAL_VARIABLES)))) {
      push(p1);
    } else {
      push_symbol(YYRECT);
      push(p1);
      list(2);
    }

    // TODO this is quite dirty, ideally we don't need this
    // but removing this creates a few failings in the tests
    // that I can't investigate right now.
    // --
    // if we assume all variables are real AND
    // it's not an exponential nor a polar nor a clock form
    // THEN rect(_) = _
    // note that these matches can be quite sloppy, one can find expressions
    // which shouldn't match but do
    //
  } else if (
    !isZeroAtomOrTensor(get_binding(symbol(ASSUME_REAL_VARIABLES))) &&
    !findPossibleExponentialForm(p1) && // no exp form?
    !findPossibleClockForm(p1, p1) && // no clock form?
    !(
      Find(p1, symbol(SIN)) &&
      Find(p1, symbol(COS)) &&
      Find(p1, defs.imaginaryunit)
    )
  ) {
    // no polar form?
    if (DEBUG_RECT) {
      console.log(' rect: simple symbol: ' + input);
    }
    push(p1);

    // ib
  } else if (
    car(p1) === symbol(MULTIPLY) &&
    isimaginaryunit(cadr(p1)) &&
    !isZeroAtomOrTensor(get_binding(symbol(ASSUME_REAL_VARIABLES)))
  ) {
    push(p1);

    // sum
  } else if (car(p1) === symbol(ADD)) {
    if (DEBUG_RECT) {
      console.log(' rect - ' + input + ' is a sum ');
    }
    push_integer(0);
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      rect();
      add();
      p1 = cdr(p1);
    }
  } else {
    // try to get to the rectangular form by doing
    // abs(p1) * (cos (theta) + i * sin(theta))
    // where theta is arg(p1)
    if (DEBUG_RECT) {
      console.log(' rect - ' + input + ' is NOT a sum ');
    }

    push(p1); // abs(z) * (cos(arg(z)) + i sin(arg(z)))
    abs();

    if (DEBUG_RECT) {
      console.log(' rect - ' + input + ' abs: ' + top().toString());
    }
    push(p1);
    arg();
    if (DEBUG_RECT) {
      console.log(
        ' rect - ' + input + ' arg of ' + p1 + ' : ' + top().toString()
      );
    }
    p1 = pop();
    push(p1);
    cosine();
    if (DEBUG_RECT) {
      console.log(' rect - ' + input + ' cosine: ' + top().toString());
    }
    push(defs.imaginaryunit);
    push(p1);
    sine();
    if (DEBUG_RECT) {
      console.log(' rect - ' + input + ' sine: ' + top().toString());
    }
    multiply();
    if (DEBUG_RECT) {
      console.log(' rect - ' + input + ' i * sine: ' + top().toString());
    }
    add();
    if (DEBUG_RECT) {
      console.log(' rect - ' + input + ' cos + i * sine: ' + top().toString());
    }
    multiply();
  }
  if (DEBUG_RECT) {
    console.log('rect of ' + input + ' : ' + top());
  }
}
