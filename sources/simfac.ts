import {
  ADD,
  caadr,
  cadadr,
  caddr,
  cadr,
  car,
  cdr,
  defs,
  FACTORIAL,
  MULTIPLY,
  NIL,
  POWER,
  symbol,
  U,
} from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { equal } from '../sources/misc';
import { add, add_all, subtract } from './add';
import { push_integer } from './bignum';
import { Eval } from './eval';
import { factorial } from './factorial';
import { equaln, isminusone, isplusone } from './is';
import { multiply_all_noexpand, reciprocate } from './multiply';
/*
 Simplify factorials

The following script

  F(n,k) = k binomial(n,k)
  (F(n,k) + F(n,k-1)) / F(n+1,k)

generates

       k! n!             n! (1 - k + n)!              k! n!
 -------------------- + -------------------- - ----------------------
 (-1 + k)! (1 + n)!     (1 + n)! (-k + n)!     k (-1 + k)! (1 + n)!

Simplify each term to get

    k       1 - k + n       1
 ------- + ----------- - -------
  1 + n       1 + n       1 + n

Then simplify the sum to get

    n
 -------
  1 + n

*/
// simplify factorials term-by-term
function Eval_simfac(p1: U) {
  push(cadr(p1));
  Eval();
  return simfac();
}

//if 1
export function simfac() {
  let p1: U;
  p1 = pop();
  if (car(p1) === symbol(ADD)) {
    p1 = cdr(p1);
    const terms = [];
    while (p1 !== symbol(NIL)) {
      push(car(p1));
      simfac_term();
      terms.push(pop());
      p1 = cdr(p1);
    }
    push(add_all(terms));
  } else {
    push(p1);
    simfac_term();
  }
  return;
}

//else
/*
void
simfac(void)
{
  int h
  save()
  p1 = pop()
  if (car(p1) == symbol(ADD)) {
    h = tos
    p1 = cdr(p1)
    while (p1 != symbol(NIL)) {
      push(car(p1))
      simfac_term()
      p1 = cdr(p1)
    }
    addk(tos - h)
    p1 = pop()
    if (find(p1, symbol(FACTORIAL))) {
      push(p1)
      if (car(p1) == symbol(ADD)) {
        Condense()
        simfac_term()
      }
    }
  } else {
    push(p1)
    simfac_term()
  }
  restore()
}

*endif
*/
function simfac_term() {
  let p1 = pop();

  // if not a product of factors then done
  if (car(p1) !== symbol(MULTIPLY)) {
    push(p1);
    return;
  }

  // push all factors
  const h = defs.tos;
  p1 = cdr(p1);
  while (p1 !== symbol(NIL)) {
    push(car(p1));
    p1 = cdr(p1);
  }

  // keep trying until no more to do
  while (yysimfac(h)) {
    // do nothing
  }

  multiply_all_noexpand(defs.tos - h);
}

// try all pairs of factors
function yysimfac(h): boolean {
  let p1: U, p2: U, p3: U;

  for (let i = h; i < defs.tos; i++) {
    p1 = defs.stack[i];
    for (let j = h; j < defs.tos; j++) {
      if (i === j) {
        continue;
      }
      p2 = defs.stack[j];

      //  n! / n    ->  (n - 1)!
      if (
        car(p1) === symbol(FACTORIAL) &&
        car(p2) === symbol(POWER) &&
        isminusone(caddr(p2)) &&
        equal(cadr(p1), cadr(p2))
      ) {
        push(cadr(p1));
        push(defs.one);
        subtract();
        factorial();
        defs.stack[i] = pop();
        defs.stack[j] = defs.one;
        return true;
      }

      //  n / n!    ->  1 / (n - 1)!
      if (
        car(p2) === symbol(POWER) &&
        isminusone(caddr(p2)) &&
        caadr(p2) === symbol(FACTORIAL) &&
        equal(p1, cadadr(p2))
      ) {
        push(p1);
        push_integer(-1);
        add();
        factorial();
        reciprocate();
        defs.stack[i] = pop();
        defs.stack[j] = defs.one;
        return true;
      }

      //  (n + 1) n!  ->  (n + 1)!
      if (car(p2) === symbol(FACTORIAL)) {
        push(p1);
        push(cadr(p2));
        subtract();
        p3 = pop();
        if (isplusone(p3)) {
          push(p1);
          factorial();
          defs.stack[i] = pop();
          defs.stack[j] = defs.one;
          return true;
        }
      }

      //  1 / ((n + 1) n!)  ->  1 / (n + 1)!
      if (
        car(p1) === symbol(POWER) &&
        isminusone(caddr(p1)) &&
        car(p2) === symbol(POWER) &&
        isminusone(caddr(p2)) &&
        caadr(p2) === symbol(FACTORIAL)
      ) {
        push(cadr(p1));
        push(cadr(cadr(p2)));
        subtract();
        p3 = pop();
        if (isplusone(p3)) {
          push(cadr(p1));
          factorial();
          reciprocate();
          defs.stack[i] = pop();
          defs.stack[j] = defs.one;
          return true;
        }
      }

      //  (n + 1)! / n!  ->  n + 1

      //  n! / (n + 1)!  ->  1 / (n + 1)
      if (
        car(p1) === symbol(FACTORIAL) &&
        car(p2) === symbol(POWER) &&
        isminusone(caddr(p2)) &&
        caadr(p2) === symbol(FACTORIAL)
      ) {
        push(cadr(p1));
        push(cadr(cadr(p2)));
        subtract();
        p3 = pop();
        if (isplusone(p3)) {
          defs.stack[i] = cadr(p1);
          defs.stack[j] = defs.one;
          return true;
        }
        if (isminusone(p3)) {
          push(cadr(cadr(p2)));
          reciprocate();
          defs.stack[i] = pop();
          defs.stack[j] = defs.one;
          return true;
        }
        if (equaln(p3, 2)) {
          defs.stack[i] = cadr(p1);
          push(cadr(p1));
          push_integer(-1);
          add();
          defs.stack[j] = pop();
          return true;
        }
        if (equaln(p3, -2)) {
          push(cadr(cadr(p2)));
          reciprocate();
          defs.stack[i] = pop();
          push(cadr(cadr(p2)));
          push_integer(-1);
          add();
          reciprocate();
          defs.stack[j] = pop();
          return true;
        }
      }
    }
  }
  return false;
}
