import {
  cadr,
  car,
  cdr,
  COS,
  COSH,
  defs,
  iscons,
  SIN,
  SINH,
  symbol,
  TAN,
  TANH,
  TENSOR,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { exponential } from '../sources/misc';
import { add, subtract } from './add';
import { push_integer, push_rational } from './bignum';
import { Eval } from './eval';
import { expcos } from './expcos';
import { expsin } from './expsin';
import { list } from './list';
import { divide, multiply, negate } from './multiply';
import { copy_tensor } from './tensor';
/* circexp =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------

Returns expression x with circular and hyperbolic functions converted to exponential forms. Sometimes this will simplify an expression.

*/
export function Eval_circexp(p1: U) {
  push(cadr(p1));
  Eval();

  circexp();

  // normalize

  Eval();
}

function circexp() {
  let p1 = pop();

  if (car(p1) === symbol(COS)) {
    push(cadr(p1));
    expcos();
    return;
  }

  if (car(p1) === symbol(SIN)) {
    push(cadr(p1));
    expsin();
    return;
  }

  if (car(p1) === symbol(TAN)) {
    p1 = cadr(p1);
    push(defs.imaginaryunit);
    push(p1);
    multiply();
    exponential();
    const p2 = pop();
    push(defs.imaginaryunit);
    push(p1);
    multiply();
    negate();
    exponential();
    const p3 = pop();
    push(p3);
    push(p2);
    subtract();
    push(defs.imaginaryunit);
    multiply();
    push(p2);
    push(p3);
    add();
    divide();
    return;
  }

  if (car(p1) === symbol(COSH)) {
    p1 = cadr(p1);
    push(p1);
    exponential();
    push(p1);
    negate();
    exponential();
    add();
    push_rational(1, 2);
    multiply();
    return;
  }

  if (car(p1) === symbol(SINH)) {
    p1 = cadr(p1);
    push(p1);
    exponential();
    push(p1);
    negate();
    exponential();
    subtract();
    push_rational(1, 2);
    multiply();
    return;
  }

  if (car(p1) === symbol(TANH)) {
    p1 = cadr(p1);
    push(p1);
    push_integer(2);
    multiply();
    exponential();
    p1 = pop();
    push(p1);
    push_integer(1);
    subtract();
    push(p1);
    push_integer(1);
    add();
    divide();
    return;
  }

  if (iscons(p1)) {
    const h = defs.tos;
    while (iscons(p1)) {
      push(car(p1));
      circexp();
      p1 = cdr(p1);
    }
    list(defs.tos - h);
    return;
  }

  if (p1.k === TENSOR) {
    p1 = copy_tensor(p1);
    for (let i = 0; i < p1.tensor.nelem; i++) {
      push(p1.tensor.elem[i]);
      circexp();
      p1.tensor.elem[i] = pop();
    }
    push(p1);
    return;
  }

  push(p1);
}
