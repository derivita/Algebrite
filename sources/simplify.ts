import { gcd } from './gcd';
import { count } from '../runtime/count';
import { alloc_tensor } from '../runtime/alloc';
import { countOccurrencesOfSymbol } from '../runtime/count';
import {
  ADD,
  caddr,
  cadr,
  car,
  cdr,
  COS,
  DEBUG,
  defs,
  do_simplify_nested_radicals,
  FACTORIAL,
  FUNCTION,
  INTEGRAL,
  iscons,
  isinnerordot,
  istensor,
  MAX_CONSECUTIVE_APPLICATIONS_OF_ALL_RULES,
  MAX_CONSECUTIVE_APPLICATIONS_OF_SINGLE_RULE,
  METAA,
  METAB,
  METAX,
  MULTIPLY,
  NIL,
  POWER,
  SECRETX,
  SIN,
  symbol,
  Tensor,
  TRANSPOSE,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { pop, push, top } from '../runtime/stack';
import { get_binding, push_symbol } from '../runtime/symbol';
import { equal, length } from '../sources/misc';
import { add } from './add';
import { pop_double, push_integer, push_rational } from './bignum';
import { clockform } from './clock';
import { Condense, yycondense } from './condense';
import { denominator } from './denominator';
import { Eval } from './eval';
import { factor } from './factor';
import { yyfloat } from './float';
import { areunivarpolysfactoredorexpandedform } from './gcd';
import { inner } from './inner';
import {
  equalq,
  isfraction,
  isimaginaryunit,
  isminusone,
  isnegativenumber,
  isone,
  isZeroAtomOrTensor,
} from './is';
import { list } from './list';
import {
  divide,
  inverse,
  multiply,
  multiply_noexpand,
  negate,
} from './multiply';
import { numerator } from './numerator';
import { polar } from './polar';
import { power } from './power';
import { rationalize } from './rationalize';
import { real } from './real';
import { rect } from './rect';
import { roots } from './roots';
import { simfac } from './simfac';
import { check_tensor_dimensions } from './tensor';
import { transform } from './transform';
import { transpose } from './transpose';

export function Eval_simplify(p1: U) {
  push(cadr(p1));
  runUserDefinedSimplifications();
  Eval();
  simplify();
}

function runUserDefinedSimplifications() {
  // -----------------------
  // unfortunately for the time being user
  // specified simplifications are only
  // run in things which don't contain
  // integrals.
  // Doesn't work yet, could be because of
  // some clobbering as "transform" is called
  // recursively?
  if (
    defs.userSimplificationsInListForm.length !== 0 &&
    !Find(top(), symbol(INTEGRAL))
  ) {
    const originalexpanding = defs.expanding;
    defs.expanding = 0;
    if (DEBUG) {
      console.log('runUserDefinedSimplifications passed: ' + top().toString());
    }
    Eval();
    if (DEBUG) {
      console.log(
        'runUserDefinedSimplifications after eval no expanding: ' +
          top().toString()
      );
    }
    defs.expanding = originalexpanding;

    let p1 = top();

    if (DEBUG) {
      console.log('patterns to be checked: ');
    }
    for (const eachSimplification of Array.from(
      defs.userSimplificationsInListForm
    )) {
      if (DEBUG) {
        console.log('...' + eachSimplification);
      }
    }

    let atLeastOneSuccessInRouldOfRulesApplications = true;
    let numberOfRulesApplications = 0;

    while (
      atLeastOneSuccessInRouldOfRulesApplications &&
      numberOfRulesApplications < MAX_CONSECUTIVE_APPLICATIONS_OF_ALL_RULES
    ) {
      atLeastOneSuccessInRouldOfRulesApplications = false;
      numberOfRulesApplications++;
      for (const eachSimplification of Array.from(
        defs.userSimplificationsInListForm
      )) {
        let success = true;
        let eachConsecutiveRuleApplication = 0;
        while (
          success &&
          eachConsecutiveRuleApplication <
            MAX_CONSECUTIVE_APPLICATIONS_OF_SINGLE_RULE
        ) {
          eachConsecutiveRuleApplication++;
          if (DEBUG) {
            console.log(
              'simplify - tos: ' +
                defs.tos +
                ' checking pattern: ' +
                eachSimplification +
                ' on: ' +
                p1
            );
          }
          push_symbol(NIL);
          success = transform(eachSimplification, true);
          if (success) {
            atLeastOneSuccessInRouldOfRulesApplications = true;
          }
          p1 = top();
          if (DEBUG) {
            console.log('p1 at this stage of simplification: ' + p1);
          }
        }
        if (
          eachConsecutiveRuleApplication ===
          MAX_CONSECUTIVE_APPLICATIONS_OF_SINGLE_RULE
        ) {
          stop(
            'maximum application of single transformation rule exceeded: ' +
              eachSimplification
          );
        }
      }
    }

    if (
      numberOfRulesApplications === MAX_CONSECUTIVE_APPLICATIONS_OF_ALL_RULES
    ) {
      stop('maximum application of all transformation rules exceeded ');
    }

    if (DEBUG) {
      console.log('METAX = ' + get_binding(symbol(METAX)));
      console.log('METAA = ' + get_binding(symbol(METAA)));
      console.log('METAB = ' + get_binding(symbol(METAB)));
    }
  }
}

// ------------------------

export function simplifyForCodeGeneration() {
  runUserDefinedSimplifications();
  defs.codeGen = true;
  // in "codeGen" mode we completely
  // eval and simplify the function bodies
  // because we really want to resolve all
  // the variables indirections and apply
  // all the simplifications we can.
  simplify_main();
  defs.codeGen = false;
}

export function simplify() {
  simplify_main();
}

function simplify_main() {
  let p1 = pop();

  // when we do code generation, we proceed to
  // fully evaluate and simplify the body of
  // a function, so we resolve all variables
  // indirections and we simplify everything
  // we can given the current assignments.
  if (defs.codeGen && car(p1) === symbol(FUNCTION)) {
    const fbody = cadr(p1);
    push(fbody);
    // let's simplify the body so we give it a
    // compact form
    Eval();
    simplify();
    const p3 = pop();

    // replace the evaled body
    const args = caddr(p1); // p5 is B

    push_symbol(FUNCTION);
    push(p3);
    push(args);
    list(3);
    p1 = pop();
  }

  if (istensor(p1)) {
    simplify_tensor(p1);
    return;
  }

  if (Find(p1, symbol(FACTORIAL))) {
    push(p1);
    simfac();
    const p2 = pop();
    push(p1);
    rationalize();
    simfac();
    const p3 = pop();
    if (count(p2) < count(p3)) {
      p1 = p2;
    } else {
      p1 = p3;
    }
  }

  [p1] = f10(p1);
  [p1] = f1(p1);
  [p1] = f2(p1);
  [p1] = f3(p1);
  [p1] = f4(p1);
  [p1] = f5(p1);
  [p1] = f9(p1);
  [p1] = simplify_polarRect(p1);
  if (do_simplify_nested_radicals) {
    let simplify_nested_radicalsResult: boolean;
    [simplify_nested_radicalsResult, p1] = simplify_nested_radicals(p1);
    // if there is some de-nesting then
    // re-run a simplification because
    // the shape of the expression might
    // have changed significantly.
    // e.g. simplify(14^(1/2) - (16 - 4*7^(1/2))^(1/2))
    // needs some more semplification after the de-nesting.
    if (simplify_nested_radicalsResult) {
      if (DEBUG) {
        console.log('de-nesting successful into: ' + p1.toString());
      }
      push(p1);
      simplify();
      return;
    }
  }

  [p1] = simplify_rectToClock(p1);
  [p1] = simplify_rational_expressions(p1);

  push(p1);
}

function simplify_tensor(p1: Tensor) {
  let p2: U = alloc_tensor(p1.tensor.nelem);
  p2.tensor.ndim = p1.tensor.ndim;
  for (let i = 0; i < p1.tensor.ndim; i++) {
    p2.tensor.dim[i] = p1.tensor.dim[i];
  }
  for (let i = 0; i < p1.tensor.nelem; i++) {
    push(p1.tensor.elem[i]);
    simplify();
    p2.tensor.elem[i] = pop();
  }

  check_tensor_dimensions(p2);

  if (isZeroAtomOrTensor(p2)) {
    p2 = defs.zero; // null tensor becomes scalar zero
  }
  push(p2);
}

// try rationalizing
function f1(p1: U): [U] {
  if (car(p1) !== symbol(ADD)) {
    return [p1];
  }
  push(p1);
  rationalize();
  const p2 = pop();
  if (count(p2) < count(p1)) {
    p1 = p2;
  }
  return [p1];
}

// try condensing
function f2(p1: U): [U] {
  if (car(p1) !== symbol(ADD)) {
    return [p1];
  }
  push(p1);
  Condense();
  const p2 = pop();
  if (count(p2) <= count(p1)) {
    p1 = p2;
  }
  return [p1];
}

// this simplifies forms like (A-B) / (B-A)
function f3(p1: U): [U] {
  push(p1);
  rationalize();
  negate();
  rationalize();
  negate();
  rationalize();
  const p2 = pop();
  if (count(p2) < count(p1)) {
    p1 = p2;
  }
  return [p1];
}

function f10(p1: U): [U] {
  const carp1 = car(p1);
  if (carp1 === symbol(MULTIPLY) || isinnerordot(p1)) {
    // both operands a transpose?

    if (
      car(car(cdr(p1))) === symbol(TRANSPOSE) &&
      car(car(cdr(cdr(p1)))) === symbol(TRANSPOSE)
    ) {
      if (DEBUG) {
        console.log('maybe collecting a transpose ' + p1);
      }
      const a = cadr(car(cdr(p1)));
      const b = cadr(car(cdr(cdr(p1))));
      if (carp1 === symbol(MULTIPLY)) {
        push(a);
        push(b);
        multiply();
      } else if (isinnerordot(p1)) {
        push(b);
        push(a);
        inner();
      }
      push_integer(1);
      push_integer(2);
      const originalexpanding = defs.expanding;
      defs.expanding = 0;
      transpose();
      defs.expanding = originalexpanding;

      const p2 = pop();
      if (count(p2) < count(p1)) {
        p1 = p2;
      }
      if (DEBUG) {
        console.log('collecting a transpose ' + p2);
      }
    }
  }
  return [p1];
}

// try expanding denominators
function f4(p1: U): [U] {
  if (isZeroAtomOrTensor(p1)) {
    return [p1];
  }
  push(p1);
  rationalize();
  inverse();
  rationalize();
  inverse();
  rationalize();
  const p2 = pop();
  if (count(p2) < count(p1)) {
    p1 = p2;
  }
  return [p1];
}

// simplifies trig forms
export function simplify_trig() {
  let p1 = pop();
  [p1] = f5(p1);
  push(p1);
}

function f5(p1: U): [U] {
  if (!Find(p1, symbol(SIN)) && !Find(p1, symbol(COS))) {
    return [p1];
  }

  const p2 = p1;

  defs.trigmode = 1;
  push(p2);
  Eval();
  let p3 = pop();

  defs.trigmode = 2;
  push(p2);
  Eval();
  let p4 = pop();

  defs.trigmode = 0;

  if (count(p4) < count(p3) || nterms(p4) < nterms(p3)) {
    p3 = p4;
  }

  if (count(p3) < count(p1) || nterms(p3) < nterms(p1)) {
    p1 = p3;
  }
  return [p1];
}

// if it's a sum then try to simplify each term
function f9(p1: U): [U] {
  if (car(p1) !== symbol(ADD)) {
    return [p1];
  }
  push_integer(0);
  let p2 = cdr(p1);
  while (iscons(p2)) {
    push(car(p2));
    simplify();
    add();

    const oldp1 = p1;
    const oldp2 = p2;
    p1 = pop();
    [p1] = simplify_rational_expressions(p1);
    push(p1);
    p1 = oldp1;
    p2 = oldp2;

    p2 = cdr(p2);
  }
  p2 = pop();
  if (count(p2) < count(p1)) {
    p1 = p2;
  }
  return [p1];
}

function simplify_rational_expressions(p1: U): [U] {
  let polyVar: U | false;
  push(p1);
  denominator();
  const denom = pop();

  if (isone(denom)) {
    return [p1];
  }

  push(p1);
  numerator();
  const num = pop();

  if (isone(num)) {
    return [p1];
  }

  // Assignment in an if condition
  if (!(polyVar = areunivarpolysfactoredorexpandedform(num, denom))) {
    return [p1];
  }

  push(num);
  push(denom);
  gcd();

  push(polyVar);
  factor();

  const theGCD = pop();

  // if there are no common factors then
  // bail
  if (isone(theGCD)) {
    return [p1];
  }

  push(num);
  push(polyVar);
  factor();
  push(theGCD);
  //divide()
  inverse();
  multiply_noexpand();
  simplify();
  let sasa = top().toString();

  push(denom);
  push(polyVar);
  factor();
  push(theGCD);
  //divide()
  inverse();
  multiply_noexpand();
  simplify();
  sasa = top().toString();

  divide();
  //simplify()
  Condense();
  sasa = top().toString();

  const p2 = pop();
  if (count(p2) < count(p1)) {
    p1 = p2;
  }
  return [p1];
}

// things like 6*(cos(2/9*pi)+i*sin(2/9*pi))
// where we have sin and cos, those might start to
// look better in clock form i.e.  6*(-1)^(2/9)
function simplify_rectToClock(p1: U): [U] {
  let p2: U;
  //debugger

  if (!Find(p1, symbol(SIN)) && !Find(p1, symbol(COS))) {
    return [p1];
  }

  push(p1);
  Eval();
  clockform();

  p2 = pop(); // put new (hopefully simplified expr) in p2
  if (DEBUG) {
    console.log('before simplification clockform: ' + p1 + ' after: ' + p2);
  }

  if (count(p2) < count(p1)) {
    p1 = p2;
  }
  return [p1];
}

function simplify_polarRect(p1: U): [U] {
  let p2: U;
  push(p1);

  polarRectAMinusOneBase();
  Eval();

  p2 = pop(); // put new (hopefully simplified expr) in p2

  if (count(p2) < count(p1)) {
    p1 = p2;
  }
  return [p1];
}

function polarRectAMinusOneBase() {
  let p1: U;
  p1 = pop();

  if (isimaginaryunit(p1)) {
    push(p1);
    return;
  }

  if (equal(car(p1), symbol(POWER)) && isminusone(cadr(p1))) {
    // base we just said is minus 1
    push(defs.one);
    negate();

    // exponent
    push(caddr(p1));
    polarRectAMinusOneBase();

    power();
    // try to simplify it using polar and rect
    polar();
    rect();
  } else if (iscons(p1)) {
    const h = defs.tos;
    while (iscons(p1)) {
      //console.log("recursing on: " + car(p1).toString())
      push(car(p1));
      polarRectAMinusOneBase();
      //console.log("...transformed into: " + stack[tos-1].toString())
      p1 = cdr(p1);
    }
    list(defs.tos - h);
  } else {
    push(p1);
  }
}

function nterms(p: U) {
  if (car(p) !== symbol(ADD)) {
    return 1;
  } else {
    return length(p) - 1;
  }
}

function simplify_nested_radicals(p1: U): [boolean, U] {
  if (defs.recursionLevelNestedRadicalsRemoval > 0) {
    if (DEBUG) {
      console.log('denesting bailing out because of too much recursion');
    }
    return [false, p1];
  }

  push(p1);
  const somethingSimplified: boolean = take_care_of_nested_radicals();

  // in this paragraph we check whether we can collect
  // common factors without complicating the expression
  // in particular we want to avoid
  // collecting radicals like in this case where
  // we collect sqrt(2):
  //   2-2^(1/2) into 2^(1/2)*(-1+2^(1/2))
  // but we do like to collect other non-radicals e.g.
  //   17/2+3/2*5^(1/2) into 1/2*(17+3*5^(1/2))
  // so what we do is we count the powers and we check
  // which version has the least number of them.
  const simplificationWithoutCondense = top();

  const prev_expanding = defs.expanding;
  defs.expanding = 0;
  yycondense();
  defs.expanding = prev_expanding;

  const simplificationWithCondense = pop();
  //console.log("occurrences of powers in " + simplificationWithoutCondense + " :" + countOccurrencesOfSymbol(symbol(POWER),simplificationWithoutCondense))
  //console.log("occurrences of powers in " + simplificationWithCondense + " :" + countOccurrencesOfSymbol(symbol(POWER),simplificationWithCondense))

  if (
    countOccurrencesOfSymbol(symbol(POWER), simplificationWithoutCondense) <
    countOccurrencesOfSymbol(symbol(POWER), simplificationWithCondense)
  ) {
    push(simplificationWithoutCondense);
  } else {
    push(simplificationWithCondense);
  }

  // we got out result, wrap up
  p1 = pop();
  return [somethingSimplified, p1];
}

function take_care_of_nested_radicals(): boolean {
  if (defs.recursionLevelNestedRadicalsRemoval > 0) {
    if (DEBUG) {
      console.log('denesting bailing out because of too much recursion');
    }
    return false;
  }

  let p1 = pop();
  //console.log("take_care_of_nested_radicals p1: " + p1.toString())

  if (equal(car(p1), symbol(POWER))) {
    //console.log("ok it's a power ")
    const base = cadr(p1);
    const exponent = caddr(p1);
    //console.log("possible double radical base: " + base)
    //console.log("possible double radical exponent: " + exponent)

    if (
      !isminusone(exponent) &&
      equal(car(base), symbol(ADD)) &&
      isfraction(exponent) &&
      (equalq(exponent, 1, 3) || equalq(exponent, 1, 2))
    ) {
      //console.log("ok there is a radix with a term inside")
      let checkSize, i, innerbase, innerexponent, lowercase_a;
      const firstTerm = cadr(base);
      push(firstTerm);
      take_care_of_nested_radicals();
      pop();
      const secondTerm = caddr(base);
      push(secondTerm);
      take_care_of_nested_radicals();
      pop();

      //console.log("possible double radical term1: " + firstTerm)
      //console.log("possible double radical term2: " + secondTerm)

      let numberOfTerms = 0;
      let countingTerms = base;
      while (cdr(countingTerms) !== symbol(NIL)) {
        numberOfTerms++;
        countingTerms = cdr(countingTerms);
      }
      //console.log("number of terms: " + numberOfTerms)
      if (numberOfTerms > 2) {
        //console.log("too many terms under outer radix ")
        push(p1);
        return false;
      }

      // list here all the factors
      let commonInnerExponent = null;
      const commonBases = [];
      const termsThatAreNotPowers = [];
      if (car(secondTerm) === symbol(MULTIPLY)) {
        // product of factors
        let secondTermFactor = cdr(secondTerm);
        if (iscons(secondTermFactor)) {
          while (iscons(secondTermFactor)) {
            //console.log("second term factor BIS: " + car(secondTermFactor).toString())
            const potentialPower = car(secondTermFactor);
            if (car(potentialPower) === symbol(POWER)) {
              innerbase = cadr(potentialPower);
              innerexponent = caddr(potentialPower);
              if (equalq(innerexponent, 1, 2)) {
                //console.log("tackling double radical 1: " + p1.toString())
                if (commonInnerExponent == null) {
                  commonInnerExponent = innerexponent;
                  commonBases.push(innerbase);
                } else {
                  if (equal(innerexponent, commonInnerExponent)) {
                    //console.log("common base: " + innerbase.toString())
                    commonBases.push(innerbase);
                  }
                }
              }
              //console.log("no common bases here ")
              //console.log("this one is a power base: " + innerbase + " , exponent: " + innerexponent)
            } else {
              termsThatAreNotPowers.push(potentialPower);
            }
            secondTermFactor = cdr(secondTermFactor);
          }
        }
      } else if (car(secondTerm) === symbol(POWER)) {
        innerbase = cadr(secondTerm);
        innerexponent = caddr(secondTerm);
        if (commonInnerExponent == null && equalq(innerexponent, 1, 2)) {
          //console.log("tackling double radical 2: " + p1.toString())
          commonInnerExponent = innerexponent;
          commonBases.push(innerbase);
        }
      }

      if (commonBases.length === 0) {
        push(p1);
        return false;
      }

      const A = firstTerm;
      //console.log("A: " + A.toString())

      push_integer(1);
      for (i of Array.from(commonBases)) {
        push(i);
        multiply();
      }
      //console.log("basis with common exponent: " + i.toString())
      const C = pop();
      //console.log("C: " + C.toString())

      push_integer(1);
      for (i of Array.from(termsThatAreNotPowers)) {
        push(i);
        multiply();
      }
      //console.log("terms that are not powers: " + i.toString())
      const B = pop();
      //console.log("B: " + B.toString())

      if (equalq(exponent, 1, 3)) {
        push(A);
        negate();
        push(C);
        multiply();
        push(B);
        divide(); // 4th coeff
        //console.log("constant coeff " + stack[tos-1].toString())
        checkSize = pop();
        push(checkSize);
        real();
        yyfloat();
        if (Math.abs(pop_double()) > Math.pow(2, 32)) {
          push(p1);
          return false;
        }
        push(checkSize);

        push_integer(3);
        push(C);
        multiply(); // 3rd coeff
        //console.log("next coeff " + stack[tos-1].toString())
        checkSize = pop();
        push(checkSize);
        real();
        yyfloat();
        if (Math.abs(pop_double()) > Math.pow(2, 32)) {
          pop();
          push(p1);
          return false;
        }
        push(checkSize);

        push(symbol(SECRETX));
        multiply();

        push_integer(-3);
        push(A);
        multiply();
        push(B);
        divide(); // 2nd coeff
        checkSize = pop();
        push(checkSize);
        real();
        yyfloat();
        if (Math.abs(pop_double()) > Math.pow(2, 32)) {
          pop();
          pop();
          push(p1);
          return false;
        }
        push(checkSize);

        //console.log("next coeff " + stack[tos-1].toString())
        push(symbol(SECRETX));
        push_integer(2);
        power();
        multiply();

        push_integer(1); // 1st coeff
        //console.log("next coeff " + stack[tos-1].toString())
        push(symbol(SECRETX));
        push_integer(3);
        power();
        multiply();

        add();
        add();
        add();
      } else if (equalq(exponent, 1, 2)) {
        push(C); // 3th coeff
        checkSize = pop();
        push(checkSize);
        real();
        yyfloat();
        if (Math.abs(pop_double()) > Math.pow(2, 32)) {
          push(p1);
          return false;
        }
        push(checkSize);
        //console.log("constant coeff " + stack[tos-1].toString())

        push_integer(-2);
        push(A);
        multiply();
        push(B);
        divide(); // 2nd coeff
        checkSize = pop();
        push(checkSize);
        real();
        yyfloat();
        if (Math.abs(pop_double()) > Math.pow(2, 32)) {
          pop();
          push(p1);
          return false;
        }
        push(checkSize);

        //console.log("next coeff " + stack[tos-1].toString())
        push(symbol(SECRETX));
        multiply();

        push_integer(1); // 1st coeff
        //console.log("next coeff " + stack[tos-1].toString())
        push(symbol(SECRETX));
        push_integer(2);
        power();
        multiply();

        add();
        add();
      }

      //console.log("whole polynomial: " + stack[tos-1].toString())

      push(symbol(SECRETX));

      defs.recursionLevelNestedRadicalsRemoval++;
      //console.log("invoking roots at recursion level: " + recursionLevelNestedRadicalsRemoval)
      roots();
      defs.recursionLevelNestedRadicalsRemoval--;
      if (equal(top(), symbol(NIL))) {
        if (DEBUG) {
          console.log('roots bailed out because of too much recursion');
        }
        pop();
        push(p1);
        return false;
      }

      //console.log("all solutions: " + stack[tos-1].toString())

      // exclude the solutions with radicals
      const possibleSolutions: U[] = [];
      for (let eachSolution of (top() as Tensor).elem) {
        if (!Find(eachSolution, symbol(POWER))) {
          possibleSolutions.push(eachSolution);
        }
      }

      pop(); // popping the tensor with the solutions

      //console.log("possible solutions: " + possibleSolutions.toString())
      if (possibleSolutions.length === 0) {
        push(p1);
        return false;
      }

      const possibleRationalSolutions: U[] = [];
      const realOfpossibleRationalSolutions: number[] = [];
      //console.log("checking the one with maximum real part ")
      for (i of Array.from(possibleSolutions)) {
        push(i);
        real();
        yyfloat();
        possibleRationalSolutions.push(i);
        realOfpossibleRationalSolutions.push(pop_double());
      }

      const whichRationalSolution = realOfpossibleRationalSolutions.indexOf(
        Math.max.apply(Math, realOfpossibleRationalSolutions)
      );
      const SOLUTION = possibleRationalSolutions[whichRationalSolution];
      //console.log("picked solution: " + SOLUTION)

      /*
      *possibleNewExpressions = []
      *realOfPossibleNewExpressions = []
      * pick the solution which cubic root has no radicals
      lowercase_b = null
      for SOLUTION in possibleSolutions
        console.log("testing solution: " + SOLUTION.toString())

        debugger
        if equalq(exponent,1,3)
          push(A)
          push(SOLUTION)
          push_integer(3)
          power()
          push_integer(3)
          push(C)
          multiply()
          push(SOLUTION)
          multiply()
          add()
          divide()
          console.log("argument of cubic root: " + stack[tos-1].toString())
          push_rational(1,3)
          power()
        else if equalq(exponent,1,2)
          push(A)
          push(SOLUTION)
          push_integer(2)
          power()
          push(C)
          add()
          divide()
          console.log("argument of cubic root: " + stack[tos-1].toString())
          push_rational(1,2)
          power()
        console.log("b is: " + stack[tos-1].toString())

        lowercase_b = pop()

        if !Find(lowercase_b, symbol(POWER))
          break
      */

      if (equalq(exponent, 1, 3)) {
        push(A);
        push(SOLUTION);
        push_integer(3);
        power();
        push_integer(3);
        push(C);
        multiply();
        push(SOLUTION);
        multiply();
        add();
        divide();
        //console.log("argument of cubic root: " + stack[tos-1].toString())
        push_rational(1, 3);
        power();
      } else if (equalq(exponent, 1, 2)) {
        push(A);
        push(SOLUTION);
        push_integer(2);
        power();
        push(C);
        add();
        divide();
        //console.log("argument of cubic root: " + stack[tos-1].toString())
        push_rational(1, 2);
        power();
      }
      //console.log("b is: " + stack[tos-1].toString())

      let lowercase_b = pop();
      if (lowercase_b == null) {
        push(p1);
        return false;
      }

      push(lowercase_b);
      push(SOLUTION);
      multiply();

      if (equalq(exponent, 1, 3)) {
        //console.log("a is: " + stack[tos-1].toString())
        lowercase_a = pop();

        push(lowercase_b);
        push(C);
        push_rational(1, 2);
        power();
        multiply();

        push(lowercase_a);
        add();
        simplify();
      } else if (equalq(exponent, 1, 2)) {
        //console.log("a could be: " + stack[tos-1].toString())
        lowercase_a = pop();

        push(lowercase_b);
        push(C);
        push_rational(1, 2);
        power();
        multiply();

        push(lowercase_a);
        add();
        simplify();
        const possibleNewExpression = pop();
        //console.log("verifying if  " + possibleNewExpression + " is positive")
        push(possibleNewExpression);
        real();
        yyfloat();
        const possibleNewExpressionValue = pop();
        if (!isnegativenumber(possibleNewExpressionValue)) {
          //console.log("... it is positive")
          push(possibleNewExpression);
        } else {
          //console.log("... it is NOT positive")
          push(lowercase_b);
          negate();
          lowercase_b = pop();

          push(lowercase_a);
          negate();
          lowercase_a = pop();

          push(lowercase_b);
          push(C);
          push_rational(1, 2);
          power();
          multiply();

          push(lowercase_a);
          add();
          simplify();
        }
      }
      // possibleNewExpression is now at top of stack

      //console.log("potential new expression: " + stack[tos-1].toString())
      p1 = pop();
      //newExpression = pop()
      //debugger
      //push(newExpression)
      //real()
      //yyfloat()
      //possibleNewExpressions.push(newExpression)
      //realOfPossibleNewExpressions.push(pop_double())

      //whichExpression = realOfPossibleNewExpressions.indexOf(Math.max.apply(Math, realOfPossibleNewExpressions))
      //p1 = possibleNewExpressions[whichExpression]
      //console.log("final new expression: " + p1.toString())

      push(p1);
      return true;
    } else {
      push(p1);
      return false;
    }
  } else if (iscons(p1)) {
    const h = defs.tos;
    let anyRadicalSimplificationWorked = false;
    while (iscons(p1)) {
      //console.log("recursing on: " + car(p1).toString())
      push(car(p1));
      anyRadicalSimplificationWorked =
        anyRadicalSimplificationWorked || take_care_of_nested_radicals();
      //console.log("...transformed into: " + stack[tos-1].toString())
      p1 = cdr(p1);
    }
    list(defs.tos - h);
    return anyRadicalSimplificationWorked;
  } else {
    push(p1);
    return false;
  }

  throw new Error('control flow should never reach here');
}
