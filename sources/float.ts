import { countOccurrencesOfSymbol } from '../runtime/count';
import {
  ADD,
  cadr,
  car,
  cdr,
  DEBUG,
  defs,
  E,
  iscons,
  MULTIPLY,
  NUM,
  PI,
  POWER,
  symbol,
  TENSOR,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { bignum_float, push_double } from './bignum';
import { Eval } from './eval';
import { list } from './list';
import { copy_tensor } from './tensor';
export function Eval_float(p1: U) {
  defs.evaluatingAsFloats++;
  push(cadr(p1));
  Eval();
  yyfloat();
  Eval(); // normalize
  defs.evaluatingAsFloats--;
}

function checkFloatHasWorkedOutCompletely(nodeToCheck) {
  const numberOfPowers = countOccurrencesOfSymbol(symbol(POWER), nodeToCheck);
  const numberOfPIs = countOccurrencesOfSymbol(symbol(PI), nodeToCheck);
  const numberOfEs = countOccurrencesOfSymbol(symbol(E), nodeToCheck);
  const numberOfMults = countOccurrencesOfSymbol(symbol(MULTIPLY), nodeToCheck);
  const numberOfSums = countOccurrencesOfSymbol(symbol(ADD), nodeToCheck);
  if (DEBUG) {
    console.log('     ... numberOfPowers: ' + numberOfPowers);
    console.log('     ... numberOfPIs: ' + numberOfPIs);
    console.log('     ... numberOfEs: ' + numberOfEs);
    console.log('     ... numberOfMults: ' + numberOfMults);
    console.log('     ... numberOfSums: ' + numberOfSums);
  }
  if (
    numberOfPowers > 1 ||
    numberOfPIs > 0 ||
    numberOfEs > 0 ||
    numberOfMults > 1 ||
    numberOfSums > 1
  ) {
    return stop('float: some unevalued parts in ' + nodeToCheck);
  }
}

export function zzfloat() {
  defs.evaluatingAsFloats++;
  //p1 = pop()
  //push(cadr(p1))
  //push(p1)
  Eval();
  yyfloat();
  Eval(); // normalize
  defs.evaluatingAsFloats--;
}
// zzfloat doesn't necessarily result in a double
// , for example if there are variables. But
// in many of the tests there should be indeed
// a float, this line comes handy to highlight
// when that doesn't happen for those tests.
//checkFloatHasWorkedOutCompletely(stack[tos-1])

export function yyfloat() {
  defs.evaluatingAsFloats++;
  let p1: U = pop();
  if (iscons(p1)) {
    const h = defs.tos;
    while (iscons(p1)) {
      push(car(p1));
      yyfloat();
      p1 = cdr(p1);
    }
    list(defs.tos - h);
  } else if (p1.k === TENSOR) {
    p1 = copy_tensor(p1);
    for (let i = 0; i < p1.tensor.nelem; i++) {
      push(p1.tensor.elem[i]);
      yyfloat();
      p1.tensor.elem[i] = pop();
    }
    push(p1);
  } else if (p1.k === NUM) {
    push(p1);
    bignum_float();
  } else if (p1 === symbol(PI)) {
    push_double(Math.PI);
  } else if (p1 === symbol(E)) {
    push_double(Math.E);
  } else {
    push(p1);
  }
  defs.evaluatingAsFloats--;
}
