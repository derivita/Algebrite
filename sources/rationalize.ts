import { gcd } from './gcd';
import {
  ADD,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  iscons,
  istensor,
  MULTIPLY,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { add } from './add';
import { Condense } from './condense';
import { Eval } from './eval';
import { isnegativenumber } from './is';
import { divide, inverse, multiply } from './multiply';
import { check_tensor_dimensions } from './tensor';
export function Eval_rationalize(p1: U) {
  push(cadr(p1));
  Eval();
  rationalize();
}

export function rationalize() {
  const x = defs.expanding;
  yyrationalize();
  defs.expanding = x;
}

function yyrationalize() {
  const theArgument = pop();

  if (istensor(theArgument)) {
    __rationalize_tensor(theArgument);
    return;
  }

  defs.expanding = 0;

  if (car(theArgument) !== symbol(ADD)) {
    push(theArgument);
    return;
  }

  // get common denominator
  push(defs.one);
  multiply_denominators(theArgument);
  const commonDenominator = pop();

  // multiply each term by common denominator
  push(defs.zero);
  let eachTerm = cdr(theArgument);
  while (iscons(eachTerm)) {
    push(commonDenominator);
    push(car(eachTerm));
    multiply();
    add();
    eachTerm = cdr(eachTerm);
  }

  // collect common factors
  Condense();

  // divide by common denominator
  push(commonDenominator);
  divide();
}

function multiply_denominators(p: U) {
  if (car(p) === symbol(ADD)) {
    p = cdr(p);

    while (iscons(p)) {
      multiply_denominators_term(car(p));
      p = cdr(p);
    }
  } else {
    multiply_denominators_term(p);
  }
}

function multiply_denominators_term(p: U) {
  if (car(p) === symbol(MULTIPLY)) {
    p = cdr(p);

    while (iscons(p)) {
      multiply_denominators_factor(car(p));
      p = cdr(p);
    }
  } else {
    multiply_denominators_factor(p);
  }
}

function multiply_denominators_factor(p: U) {
  if (car(p) !== symbol(POWER)) {
    return;
  }

  push(p);

  p = caddr(p);

  // like x^(-2) ?
  if (isnegativenumber(p)) {
    inverse();
    __lcm();
    return;
  }

  // like x^(-a) ?
  if (car(p) === symbol(MULTIPLY) && isnegativenumber(cadr(p))) {
    inverse();
    __lcm();
    return;
  }

  // no match
  pop();
}

function __rationalize_tensor(theTensor) {
  push(theTensor);

  Eval(); // makes a copy

  theTensor = pop();

  if (!istensor(theTensor)) {
    // might be zero
    push(theTensor);
    return;
  }

  const n = theTensor.tensor.nelem;

  for (let i = 0; i < n; i++) {
    push(theTensor.tensor.elem[i]);
    rationalize();
    theTensor.tensor.elem[i] = pop();
  }

  check_tensor_dimensions(theTensor);

  push(theTensor);
}

function __lcm() {
  const p1 = pop();
  const p2 = pop();

  push(p1);
  push(p2);
  multiply();
  push(p1);
  push(p2);
  gcd();
  divide();
}
