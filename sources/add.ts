import {
  ADD,
  car,
  cdr,
  Cons,
  DEBUG,
  defs,
  isNumericAtom,
  istensor,
  MULTIPLY,
  NIL,
  Sign,
  symbol,
  U,
} from '../runtime/defs';
import { check_esc_flag } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { cmp_expr, equal } from '../sources/misc';
import { add_numbers, push_double } from './bignum';
import { cons } from './cons';
import { Eval } from './eval';
import { isZeroAtom, isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import { multiply, negate } from './multiply';
import { print_list } from './print';
import { tensor_plus_tensor } from './tensor';
/*
 Symbolic addition

  Terms in a sum are combined if they are identical modulo rational
  coefficients.

  For example, A + 2A becomes 3A.

  However, the sum A + sqrt(2) A is not modified.

  Combining terms can lead to second-order effects.

  For example, consider the case of

    1/sqrt(2) A + 3/sqrt(2) A + sqrt(2) A

  The first two terms are combined to yield 2 sqrt(2) A.

  This result can now be combined with the third term to yield

    3 sqrt(2) A
*/

let flag = 0;

export function Eval_add(p1: Cons) {
  const terms: U[] = [];
  p1 = cdr(p1) as Cons;
  for (const t of p1) {
    push(t);
    Eval();
    const p2 = pop();
    push_terms(terms, p2);
  }
  push(add_terms(terms));
}

// Add terms, returns one expression.
function add_terms(terms: U[]): U {
  // ensure no infinite loop, use "for"
  if (DEBUG) {
    for (const term of terms) {
      console.log(print_list(term));
    }
  }

  for (let i = 0; i < 10; i++) {
    if (terms.length < 2) {
      break;
    }

    flag = 0;
    terms.sort(cmp_terms);

    if (flag === 0) {
      break;
    }

    combine_terms(terms);
  }

  switch (terms.length) {
    case 0:
      if (defs.evaluatingAsFloats) {
        push_double(0.0);
        return pop();
      } else {
        return defs.zero;
      }
    case 1:
      return terms[0];
    default:
      terms.unshift(symbol(ADD));
      return makeList(...terms);
  }
}

let cmp_terms_count = 0;

// Compare terms for order.
function cmp_terms(p1: U, p2: U): Sign {
  cmp_terms_count++;
  //if cmp_terms_count == 52
  //  debugger

  // numbers can be combined

  if (isNumericAtom(p1) && isNumericAtom(p2)) {
    flag = 1;
    //if DEBUG then console.log "cmp_terms #" + cmp_terms_count + " returns 0"
    return 0;
  }

  // congruent tensors can be combined

  if (istensor(p1) && istensor(p2)) {
    if (p1.tensor.ndim < p2.tensor.ndim) {
      //if DEBUG then console.log "cmp_terms #" + cmp_terms_count + " returns -1"
      return -1;
    }
    if (p1.tensor.ndim > p2.tensor.ndim) {
      //if DEBUG then console.log "cmp_terms #" + cmp_terms_count + " returns 1"
      return 1;
    }
    for (let i = 0; i < p1.tensor.ndim; i++) {
      if (p1.tensor.dim[i] < p2.tensor.dim[i]) {
        //if DEBUG then console.log "cmp_terms #" + cmp_terms_count + " returns -1"
        return -1;
      }
      if (p1.tensor.dim[i] > p2.tensor.dim[i]) {
        //if DEBUG then console.log "cmp_terms #" + cmp_terms_count + " returns 1"
        return 1;
      }
    }
    flag = 1;
    //if DEBUG then console.log "cmp_terms #" + cmp_terms_count + " returns 0"
    return 0;
  }

  if (car(p1) === symbol(MULTIPLY)) {
    p1 = cdr(p1);
    if (isNumericAtom(car(p1))) {
      p1 = cdr(p1);
      if (cdr(p1) === symbol(NIL)) {
        p1 = car(p1);
      }
    }
  }

  if (car(p2) === symbol(MULTIPLY)) {
    p2 = cdr(p2);
    if (isNumericAtom(car(p2))) {
      p2 = cdr(p2);
      if (cdr(p2) === symbol(NIL)) {
        p2 = car(p2);
      }
    }
  }

  const t = cmp_expr(p1, p2);

  if (t === 0) {
    flag = 1;
  }

  //if DEBUG then console.log "cmp_terms #" + cmp_terms_count + " returns " + t
  return t;
}

/*
 Compare adjacent terms in terms[] and combine if possible.
*/
function combine_terms(terms: U[]) {
  // I had to turn the coffeescript for loop into
  // a more mundane while loop because the i
  // variable was changed from within the body,
  // which is something that is not supposed to
  // happen in the coffeescript 'vector' form.
  // Also this means I had to add a 'i++' jus before
  // the end of the body and before the "continue"s
  let i = 0;
  while (i < terms.length - 1) {
    check_esc_flag();
    let p1: U, p2: U;
    let p3 = terms[i];
    let p4 = terms[i + 1];

    if (istensor(p3) && istensor(p4)) {
      push(p3);
      push(p4);
      tensor_plus_tensor();
      p1 = pop();
      if (p1 !== symbol(NIL)) {
        terms.splice(i, 2, p1);
        i--;
      }

      i++;
      continue;
    }

    if (istensor(p3) || istensor(p4)) {
      i++;
      continue;
    }

    if (isNumericAtom(p3) && isNumericAtom(p4)) {
      push(p3);
      push(p4);
      add_numbers();
      p1 = pop();
      if (isZeroAtomOrTensor(p1)) {
        terms.splice(i, 2);
      } else {
        terms.splice(i, 2, p1);
      }
      i--;

      i++;
      continue;
    }

    if (isNumericAtom(p3) || isNumericAtom(p4)) {
      i++;
      continue;
    }

    if (defs.evaluatingAsFloats) {
      p1 = defs.one_as_double;
      p2 = defs.one_as_double;
    } else {
      p1 = defs.one;
      p2 = defs.one;
    }

    let t = 0;

    if (car(p3) === symbol(MULTIPLY)) {
      p3 = cdr(p3);
      t = 1; // p3 is now denormal
      if (isNumericAtom(car(p3))) {
        p1 = car(p3);
        p3 = cdr(p3);
        if (cdr(p3) === symbol(NIL)) {
          p3 = car(p3);
          t = 0;
        }
      }
    }

    if (car(p4) === symbol(MULTIPLY)) {
      p4 = cdr(p4);
      if (isNumericAtom(car(p4))) {
        p2 = car(p4);
        p4 = cdr(p4);
        if (cdr(p4) === symbol(NIL)) {
          p4 = car(p4);
        }
      }
    }

    if (!equal(p3, p4)) {
      i++;
      continue;
    }

    push(p1);
    push(p2);
    add_numbers();

    p1 = pop();

    if (isZeroAtomOrTensor(p1)) {
      terms.splice(i, 2);
      i--;

      i++;
      continue;
    }

    push(p1);

    if (t) {
      push(symbol(MULTIPLY));
      push(p3);
      cons();
    } else {
      push(p3);
    }

    multiply();

    terms.splice(i, 2, pop());
    i--;

    // this i++ is to match the while
    i++;
  }
}

function push_terms(array: U[], p: U) {
  if (car(p) === symbol(ADD)) {
    for (const t of cdr(p) as Cons) {
      array.push(t);
    }
  } else if (!isZeroAtom(p)) {
    // omit zeroes
    array.push(p);
  }
}

// add two expressions
export function add() {
  const p2 = pop();
  const p1 = pop();
  const terms: U[] = [];
  push_terms(terms, p1);
  push_terms(terms, p2);
  push(add_terms(terms));
}

export function add_all(terms: U[]) {
  const flattened: U[] = [];
  for (const t of terms) {
    push_terms(flattened, t);
  }
  return add_terms(flattened);
}

export function subtract() {
  negate();
  add();
}
