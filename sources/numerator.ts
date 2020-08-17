import {
  ADD,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  iscons,
  isrational,
  MULTIPLY,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { mp_numerator } from './bignum';
import { Eval } from './eval';
import { isnegativeterm, isplusone } from './is';
import { multiply_all } from './multiply';
import { rationalize } from './rationalize';
export function Eval_numerator(p1: U) {
  push(cadr(p1));
  Eval();
  numerator();
}

export function numerator() {
  let theArgument = pop();

  if (car(theArgument) === symbol(ADD)) {
    push(theArgument);
    //console.trace "rationalising "
    rationalize();
    theArgument = pop();
  }
  //console.log "rationalised: " + theArgument

  if (
    car(theArgument) === symbol(MULTIPLY) &&
    !isplusone(car(cdr(theArgument)))
  ) {
    const h = defs.tos;
    theArgument = cdr(theArgument);
    //console.log "theArgument inside multiply: " + theArgument
    //console.log "first term: " + car(theArgument)

    while (iscons(theArgument)) {
      push(car(theArgument));
      numerator();
      theArgument = cdr(theArgument);
    }
    multiply_all(defs.tos - h);
  } else if (isrational(theArgument)) {
    push(theArgument);
    mp_numerator();
  } else if (
    car(theArgument) === symbol(POWER) &&
    isnegativeterm(caddr(theArgument))
  ) {
    push(defs.one);
  } else {
    push(theArgument);
  }
}
