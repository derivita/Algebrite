import { alloc_tensor } from '../runtime/alloc';
import {
  cadddr,
  caddr,
  cadr,
  cddr,
  defs,
  istensor,
  NIL,
  symbol,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { add } from './add';
import { pop_integer, push_integer } from './bignum';
import { Eval } from './eval';
import { isZeroAtomOrTensor } from './is';
/* contract =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
a,i,j

General description
-------------------
Contract across tensor indices i.e. returns "a" summed over indices i and j.
If i and j are omitted then 1 and 2 are used.
contract(m) is equivalent to the trace of matrix m.

*/
export function Eval_contract(p1: U) {
  push(cadr(p1));
  Eval();
  if (cddr(p1) === symbol(NIL)) {
    push_integer(1);
    push_integer(2);
  } else {
    push(caddr(p1));
    Eval();
    push(cadddr(p1));
    Eval();
  }
  contract();
}

function contract() {
  yycontract();
}

function yycontract() {
  const ai = [];
  const an = [];

  const p3: U = pop();
  let p2: U = pop();
  const p1: U = pop();

  if (!istensor(p1)) {
    if (!isZeroAtomOrTensor(p1)) {
      stop('contract: tensor expected, 1st arg is not a tensor');
    }
    push(defs.zero);
    return;
  }

  push(p2);
  let l = pop_integer();

  push(p3);
  let m = pop_integer();

  const { ndim } = p1.tensor;

  if (
    l < 1 ||
    l > ndim ||
    m < 1 ||
    m > ndim ||
    l === m ||
    p1.tensor.dim[l - 1] !== p1.tensor.dim[m - 1]
  ) {
    stop('contract: index out of range');
  }

  l--;
  m--;

  const n = p1.tensor.dim[l];

  // nelem is the number of elements in "b"

  let nelem = 1;
  for (let i = 0; i < ndim; i++) {
    if (i !== l && i !== m) {
      nelem *= p1.tensor.dim[i];
    }
  }

  //console.log "nelem:" + nelem
  p2 = alloc_tensor(nelem);
  //console.log "p2:" + p2

  p2.tensor.ndim = ndim - 2;

  let j = 0;
  for (let i = 0; i < ndim; i++) {
    if (i !== l && i !== m) {
      p2.tensor.dim[j++] = p1.tensor.dim[i];
    }
  }

  const a = p1.tensor.elem;
  const b = p2.tensor.elem;

  //console.log "a: " + a
  //console.log "b: " + b

  for (let i = 0; i < ndim; i++) {
    ai[i] = 0;
    an[i] = p1.tensor.dim[i];
  }

  for (let i = 0; i < nelem; i++) {
    push(defs.zero);
    for (let j = 0; j < n; j++) {
      ai[l] = j;
      ai[m] = j;
      let h = 0;
      for (let k = 0; k < ndim; k++) {
        h = h * an[k] + ai[k];
      }
      push(a[h]);
      //console.log "a[h]: " + a[h]
      add();
    }
    //console.log "tos: " + stack[tos-1]
    b[i] = pop();
    //console.log "b[i]: " + b[i]
    for (let j = ndim - 1; j >= 0; j--) {
      if (j === l || j === m) {
        continue;
      }
      if (++ai[j] < an[j]) {
        break;
      }
      ai[j] = 0;
    }
  }

  if (nelem === 1) {
    push(b[0]);
  } else {
    push(p2);
  }
}

//console.log "returning: " + stack[tos-1]
