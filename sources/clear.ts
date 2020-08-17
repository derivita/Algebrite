import {
  binding,
  car,
  cdr,
  defs,
  iscons,
  isSymbolReclaimable,
  NIL,
  SYM,
  symbol,
  symtab,
  U,
} from '../runtime/defs';
import { defn } from '../runtime/init';
import { clear_term } from '../runtime/otherCFunctions';
import { run, stop } from '../runtime/run';
import { push } from '../runtime/stack';
import { clear_symbols } from '../runtime/symbol';
import { do_clearPatterns } from './pattern';
/* clearall =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

General description
-------------------

Completely wipes all variables from the environment.

*/
export function Eval_clearall() {
  let p1: U, p6: U;
  [p1, p6] = do_clearall();
  push(symbol(NIL));
}

export function do_clearall(): [any, U, U] {
  let p1: U, p6: U;
  if (defs.test_flag === 0) {
    clear_term();
  }

  do_clearPatterns();
  clear_symbols();
  [p1, p6] = defn();
  return [(defs.codeGen = false), p1, p6];
}

// clearall from application GUI code
function clearall() {
  return run('clearall');
}

// this transformation is done in run.coffee, see there
// for more info.
export function clearRenamedVariablesToAvoidBindingToExternalScope() {
  for (let i = 0; i < symtab.length; i++) {
    if (
      symtab[i].printname.indexOf('AVOID_BINDING_TO_EXTERNAL_SCOPE_VALUE') !==
      -1
    ) {
      // just clear it
      symtab[i].k = SYM;
      symtab[i].printname = '';
      binding[i] = symtab[i];
      isSymbolReclaimable[i] = true;
    }
  }
}

/* clear =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------

Completely wipes a variable from the environment (while doing x = quote(x) just unassigns it).

*/
export function Eval_clear(p1: U) {
  let p2: U;
  p2 = cdr(p1);

  while (iscons(p2)) {
    const variableToBeCleared = car(p2);
    //console.log variableToBeCleared + ""

    if (variableToBeCleared.k !== SYM) {
      stop('symbol error');
    }

    //console.log "getting binding of " + p.toString()
    //if p.toString() == "aaa"
    //  debugger

    const indexFound = symtab.indexOf(variableToBeCleared);
    symtab[indexFound].k = SYM;
    symtab[indexFound].printname = '';
    binding[indexFound] = symtab[indexFound];
    isSymbolReclaimable[indexFound] = true;

    p2 = cdr(p2);
  }

  push(symbol(NIL));
}
