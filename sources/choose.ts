import { caddr, cadr, defs, isNumericAtom, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { lessp } from '../sources/misc';
import { subtract } from './add';
import { push_integer } from './bignum';
import { Eval } from './eval';
import { factorial } from './factorial';
import { divide } from './multiply';
/* choose =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
n,k

General description
-------------------

Returns the number of combinations of n items taken k at a time.

For example, the number of five card hands is choose(52,5)

```
                          n!
      choose(n,k) = -------------
                     k! (n - k)!
```
*/
export function Eval_choose(p1: U) {
  push(cadr(p1));
  Eval();
  push(caddr(p1));
  Eval();
  choose();
}

function choose() {
  const K = pop();
  const N = pop();

  if (!choose_check_args(N, K)) {
    push_integer(0);
    return;
  }

  push(N);
  factorial();

  push(K);
  factorial();

  divide();

  push(N);
  push(K);
  subtract();
  factorial();

  divide();
}

// Result vanishes for k < 0 or k > n. (A=B, p. 19)
function choose_check_args(N: U, K: U): boolean {
  if (isNumericAtom(N) && lessp(N, defs.zero)) {
    return false;
  } else if (isNumericAtom(K) && lessp(K, defs.zero)) {
    return false;
  } else if (isNumericAtom(N) && isNumericAtom(K) && lessp(N, K)) {
    return false;
  } else {
    return true;
  }
}
