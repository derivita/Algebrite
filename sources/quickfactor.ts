import { defs, POWER, U } from '../runtime/defs';
import { moveTos, pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { subtract } from './add';
import { bignum_power_number, bignum_truncate, pop_integer } from './bignum';
import { factor_small_number } from './factor';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
import { multiply, multiply_all } from './multiply';
//-----------------------------------------------------------------------------
//
//  Factor small numerical powers
//
//  Input:    tos-2    Base (positive integer < 2^31 - 1)
//
//      tos-1    Exponent
//
//  Output:    Expr on stack
//
//-----------------------------------------------------------------------------
export function quickfactor() {
  const EXPO: U = pop();
  let BASE: U = pop();

  const h = defs.tos;

  push(BASE);

  factor_small_number();

  const n = defs.tos - h;

  const stackIndex = h;

  for (let i = 0; i < n; i += 2) {
    push(defs.stack[stackIndex + i]); // factored base
    push(defs.stack[stackIndex + i + 1]); // factored exponent
    push(EXPO);
    multiply();
    quickpower();
  }

  // stack has n results from factor_number_raw()
  // on top of that are all the expressions from quickpower()
  // multiply the quickpower() results
  multiply_all(defs.tos - h - n);

  BASE = pop();

  moveTos(h);

  push(BASE);
}

// BASE is a prime number so power is simpler
export function quickpower() {
  const EXPO = pop();
  const BASE = pop();

  push(EXPO);
  bignum_truncate();
  const p3 = pop();

  push(EXPO);
  push(p3);
  subtract();
  const p4 = pop();

  // fractional part of EXPO
  if (!isZeroAtomOrTensor(p4)) {
    push_symbol(POWER);
    push(BASE);
    push(p4);
    list(3);
  }

  push(p3);
  const expo = pop_integer();

  if (isNaN(expo)) {
    push_symbol(POWER);
    push(BASE);
    push(p3);
    list(3);
    return;
  }

  if (expo === 0) {
    return;
  }

  push(BASE);
  bignum_power_number(expo);
}

//if SELFTEST
