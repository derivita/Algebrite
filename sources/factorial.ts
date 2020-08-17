import {
  ADD,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  FACTORIAL,
  iscons,
  isfactorial,
  ispower,
  MULTIPLY,
  NIL,
  symbol,
  U,
} from '../runtime/defs';
import { moveTos, pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { yyexpand } from '../sources/misc';
import { add, subtract } from './add';
import { bignum_factorial, pop_integer, push_integer } from './bignum';
import { list } from './list';
import { multiply } from './multiply';
import { power } from './power';
export function factorial() {
  const p1 = pop();
  push(p1);
  const n = pop_integer();
  if (n < 0 || isNaN(n)) {
    push_symbol(FACTORIAL);
    push(p1);
    list(2);
    return;
  }
  bignum_factorial(n);
}

// simplification rules for factorials (m < n)
//
//  (e + 1) * factorial(e)  ->  factorial(e + 1)
//
//  factorial(e) / e  ->  factorial(e - 1)
//
//  e / factorial(e)  ->  1 / factorial(e - 1)
//
//  factorial(e + n)
//  ----------------  ->  (e + m + 1)(e + m + 2)...(e + n)
//  factorial(e + m)
//
//  factorial(e + m)                               1
//  ----------------  ->  --------------------------------
//  factorial(e + n)    (e + m + 1)(e + m + 2)...(e + n)

// this function is not actually used, but
// all these simplifications
// do happen automatically via simplify
function simplifyfactorials() {
  const x = defs.expanding;
  defs.expanding = 0;

  let p1 = pop();

  if (car(p1) === symbol(ADD)) {
    push(defs.zero);
    p1 = cdr(p1);
    while (iscons(p1)) {
      push(car(p1));
      simplifyfactorials();
      add();
      p1 = cdr(p1);
    }
    defs.expanding = x;
    return;
  }

  if (car(p1) === symbol(MULTIPLY)) {
    sfac_product(p1);
    defs.expanding = x;
    return;
  }

  push(p1);

  defs.expanding = x;
}

function sfac_product(p1: U) {
  const s = defs.tos;

  p1 = cdr(p1);
  let n = 0;
  while (iscons(p1)) {
    push(car(p1));
    p1 = cdr(p1);
    n++;
  }

  for (let i = 0; i < n - 1; i++) {
    if (defs.stack[s + i] === symbol(NIL)) {
      continue;
    }
    for (let j = i + 1; j < n; j++) {
      if (defs.stack[s + j] === symbol(NIL)) {
        continue;
      }
      sfac_product_f(s, i, j);
    }
  }

  push(defs.one);

  for (let i = 0; i < n; i++) {
    if (defs.stack[s + i] === symbol(NIL)) {
      continue;
    }
    push(defs.stack[s + i]);
    multiply();
  }

  p1 = pop();

  moveTos(defs.tos - n);

  push(p1);
}

function sfac_product_f(s: number, a: number, b: number) {
  let p3: U, p4: U;

  let p1 = defs.stack[s + a];
  let p2 = defs.stack[s + b];

  if (ispower(p1)) {
    p3 = caddr(p1);
    p1 = cadr(p1);
  } else {
    p3 = defs.one;
  }

  if (ispower(p2)) {
    p4 = caddr(p2);
    p2 = cadr(p2);
  } else {
    p4 = defs.one;
  }

  if (isfactorial(p1) && isfactorial(p2)) {
    push(p3);
    push(p4);
    add();
    yyexpand();
    let n = pop_integer();
    if (n !== 0) {
      return;
    }

    // Find the difference between the two factorial args.
    // For example, the difference between (a + 2)! and a! is 2.
    push(cadr(p1));
    push(cadr(p2));
    subtract();
    yyexpand(); // to simplify

    n = pop_integer();
    if (n === 0 || isNaN(n)) {
      return;
    }
    if (n < 0) {
      n = -n;
      const temp1 = p1;
      p1 = p2;
      p2 = temp1;

      const temp2 = p3;
      p3 = p4;
      p4 = temp2;
    }

    push(defs.one);

    for (let i = 1; i <= n; i++) {
      push(cadr(p2));
      push_integer(i);
      add();
      push(p3);
      power();
      multiply();
    }
    defs.stack[s + a] = pop();
    defs.stack[s + b] = symbol(NIL);
  }
}
