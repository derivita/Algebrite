import { stop } from './run';
import { DEBUG, defs, NIL, symbol, TOS, U } from './defs';
//   _______
//  |  | <- stack
//  |  |
//  |_______|
//  |  | <- stack + tos
//  |  |
//  |  |
//  |_______|
//  |  | <- frame
//  |_______|
//      <- stack + TOS
//
//  The stack grows from low memory towards high memory. This is so that
//  multiple expressions can be pushed on the stack and then accessed as an
//  array.
//
//  The frame area holds local variables and grows from high memory towards
//  low memory. The frame area makes local variables visible to the garbage
//  collector.

// p is a U
let nil_symbols = 0;

type ToDo_FixPushCalls = any;
/**
 * Errors include:
 * - error TS2345: Argument of type '[U]' is not assignable to parameter of type 'U'.
 * - error TS2339: Property 'isZero' does not exist on type 'U'.
 */
export function push(p: U | ToDo_FixPushCalls) {
  if (p == null) {
    debugger;
  }
  if (p.isZero != null) {
    debugger;
  }

  //console.log "pushing "
  //console.log print_list(p)

  if (p === symbol(NIL)) {
    nil_symbols++;
    if (DEBUG) {
      console.log('pushing symbol(NIL) #' + nil_symbols);
    }
  }
  //if nil_symbols == 111
  //  debugger
  if (defs.tos >= defs.frame) {
    stop('stack overflow');
  }
  return (defs.stack[defs.tos++] = p);
}

// returns a U
export function moveTos(stackPos: number) {
  if (defs.tos <= stackPos) {
    // we are moving the stack pointer
    // "up" the stack (as if we were doing a push)
    defs.tos = stackPos;
    return;
  }
  // we are moving the stack pointer
  // "down" the stack i.e. as if we were
  // doing a pop, we can zero-
  // out all the elements that we pass
  // so we can reclaim the memory
  while (defs.tos > stackPos) {
    defs.stack[defs.tos] = null;
    defs.tos--;
  }
}

export function top() {
  return defs.stack[defs.tos - 1];
}

export function pop() {
  //popsNum++
  //console.log "pop #" + popsNum
  if (defs.tos === 0) {
    debugger;
    stop('stack underflow');
  }
  if (top() == null) {
    debugger;
  }
  const elementToBeReturned = defs.stack[--defs.tos];

  // give a chance to the garbage
  // collection to reclaim space
  // This is JS-specific, it would
  // actually make the C garbage
  // collector useless.
  defs.stack[defs.tos] = null;

  return elementToBeReturned;
}

export function save() {
  let p0: U, p1: U, p2: U, p3: U, p4: U, p5: U, p6: U, p7: U, p8: U, p9: U;
  defs.frame -= 10;
  if (defs.frame < defs.tos) {
    debugger;
    stop('frame overflow, circular reference?');
  }
  defs.stack[defs.frame + 0] = p0;
  defs.stack[defs.frame + 1] = p1;
  defs.stack[defs.frame + 2] = p2;
  defs.stack[defs.frame + 3] = p3;
  defs.stack[defs.frame + 4] = p4;
  defs.stack[defs.frame + 5] = p5;
  defs.stack[defs.frame + 6] = p6;
  defs.stack[defs.frame + 7] = p7;
  defs.stack[defs.frame + 8] = p8;
  defs.stack[defs.frame + 9] = p9;
}

export function restore() {
  let p0: U, p1: U, p2: U, p3: U, p4: U, p5: U, p6: U, p7: U, p8: U, p9: U;
  if (defs.frame > TOS - 10) {
    stop('frame underflow');
  }
  p0 = defs.stack[defs.frame + 0];
  p1 = defs.stack[defs.frame + 1];
  p2 = defs.stack[defs.frame + 2];
  p3 = defs.stack[defs.frame + 3];
  p4 = defs.stack[defs.frame + 4];
  p5 = defs.stack[defs.frame + 5];
  p6 = defs.stack[defs.frame + 6];
  p7 = defs.stack[defs.frame + 7];
  p8 = defs.stack[defs.frame + 8];
  p9 = defs.stack[defs.frame + 9];
  return (defs.frame += 10);
}

// Local U * is OK here because there is no functional path to the garbage collector.
export function swap() {
  //U *p, *q
  const p = pop();
  const q = pop();
  push(p);
  push(q);
}

// Local U * is OK here because there is no functional path to the garbage collector.
export function dupl() {
  //U *p
  const p = pop();
  push(p);
  return push(p);
}
