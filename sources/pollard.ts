import bigInt from 'big-integer';
import { defs, MEQUAL, MULTIPLY, Num, POWER, primetab } from '../runtime/defs';
import { mcmp } from '../runtime/mcmp';
import { stop } from '../runtime/run';
import { pop, push, swap } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { mint, push_integer, setSignTo } from './bignum';
import { cons } from './cons';
import { equaln } from './is';
import { list } from './list';
import { madd, msub } from './madd';
import { mgcd } from './mgcd';
import { mdiv, mdivrem, mmod, mmul } from './mmul';
import { mprime } from './mprime';
// Factor using the Pollard rho method

let n_factor_number = bigInt(0);

export function factor_number() {
  const p1 = pop() as Num;

  // 0 or 1?
  if (equaln(p1, 0) || equaln(p1, 1) || equaln(p1, -1)) {
    push(p1);
    return;
  }

  n_factor_number = p1.q.a;

  const h = defs.tos;

  factor_a();

  if (defs.tos - h > 1) {
    list(defs.tos - h);
    push_symbol(MULTIPLY);
    swap();
    cons();
  }
}

// factor using table look-up, then switch to rho method if necessary
// From TAOCP Vol. 2 by Knuth, p. 380 (Algorithm A)
function factor_a() {
  if (n_factor_number.isNegative()) {
    n_factor_number = setSignTo(n_factor_number, 1);
    push_integer(-1);
  }

  for (let k = 0; k < 10000; k++) {
    try_kth_prime(k);

    // if n_factor_number is 1 then we're done
    if (n_factor_number.compare(1) === 0) {
      return;
    }
  }

  factor_b();
}

function try_kth_prime(k: number) {
  let q: bigInt.BigInteger;

  const d = mint(primetab[k]);

  let count = 0;
  while (true) {
    // if n_factor_number is 1 then we're done
    let r: bigInt.BigInteger;
    if (n_factor_number.compare(1) === 0) {
      if (count) {
        push_factor(d, count);
      }
      return;
    }

    [q, r] = Array.from(mdivrem(n_factor_number, d));

    // continue looping while remainder is zero
    if (r.isZero()) {
      count++;
      n_factor_number = q;
    } else {
      break;
    }
  }

  if (count) {
    push_factor(d, count);
  }

  // q = n_factor_number/d, hence if q < d then
  // n_factor_number < d^2 so n_factor_number is prime
  if (mcmp(q, d) === -1) {
    push_factor(n_factor_number, 1);
    n_factor_number = mint(1);
  }
}

// From TAOCP Vol. 2 by Knuth, p. 385 (Algorithm B)
function factor_b() {
  const bigint_one = mint(1);
  let x = mint(5);
  let xprime = mint(2);

  let k = 1;
  let l = 1;

  while (true) {
    if (mprime(n_factor_number)) {
      push_factor(n_factor_number, 1);
      0;
      return;
    }

    while (true) {
      if (defs.esc_flag) {
        stop('esc');
      }

      // g = gcd(x' - x, n_factor_number)
      let t = msub(xprime, x);
      t = setSignTo(t, 1);
      const g = mgcd(t, n_factor_number);

      if (MEQUAL(g, 1)) {
        if (--k === 0) {
          xprime = x;
          l *= 2;
          k = l;
        }

        // x = (x ^ 2 + 1) mod n_factor_number
        t = mmul(x, x);
        x = madd(t, bigint_one);
        t = mmod(x, n_factor_number);
        x = t;

        continue;
      }

      push_factor(g, 1);

      if (mcmp(g, n_factor_number) === 0) {
        -1;
        return;
      }

      // n_factor_number = n_factor_number / g
      t = mdiv(n_factor_number, g);
      n_factor_number = t;

      // x = x mod n_factor_number
      t = mmod(x, n_factor_number);
      x = t;

      // xprime = xprime mod n_factor_number
      t = mmod(xprime, n_factor_number);
      xprime = t;

      break;
    }
  }
}

function push_factor(d: bigInt.BigInteger, count: number) {
  push(new Num(d));
  if (count > 1) {
    push_symbol(POWER);
    swap();
    push(new Num(mint(count)));
    list(3);
  }
}
