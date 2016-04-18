bigInt = require('big-integer')

SELFTEST = 1

# size of the symbol table
NSYM = 1000

DEBUG = false
PRINTOUTRESULT = false

# Symbolic expressions are built by connecting U structs.
#
# For example, (a b + c) is built like this:
#
#           _______      _______                                _______
#          |CONS   |--->|CONS   |----------------------------->|CONS   |
#          |       |    |       |                              |       |
#          |_______|    |_______|                              |_______|
#              |            |                                      |
#           ___v___      ___v___      _______      _______      ___v___
#          |ADD    |    |CONS   |--->|CONS   |--->|CONS   |    |SYM c  |
#          |       |    |       |    |       |    |       |    |       |
#          |_______|    |_______|    |_______|    |_______|    |_______|
#                           |            |            |
#                        ___v___      ___v___      ___v___
#                       |MUL    |    |SYM a  |    |SYM b  |
#                       |       |    |       |    |       |
#                       |_______|    |_______|    |_______|



class rational
	a: null # a bigInteger
	b: null # a bigInteger

class U
	cons: null # will have a car and cdr
	printname: ""
	str: ""
	tensor: null
	# rational number a over b
	q: null # will point to a rational
	d: 0.0 # a double
	k: 0
	tag: 0

	constructor: ->
		@cons = {}
		@cons.car = null
		@cons.cdr = null
		@q = new rational()


errorMessage = ""


# the following enum is for struct U, member k

CONS = 0
NUM = 1
DOUBLE = 2
STR = 3
TENSOR = 4
SYM = 5

# the following enum is for indexing the symbol table

# standard functions first, then nil, then everything else

counter = 0
ABS = counter++
ADD = counter++
ADJ = counter++
AND = counter++
ARCCOS = counter++
ARCCOSH = counter++
ARCSIN = counter++
ARCSINH = counter++
ARCTAN = counter++
ARCTANH = counter++
ARG = counter++
ATOMIZE = counter++
BESSELJ = counter++
BESSELY = counter++
BINDING = counter++
BINOMIAL = counter++
CEILING = counter++
CHECK = counter++
CHOOSE = counter++
CIRCEXP = counter++
CLEAR = counter++
CLOCK = counter++
COEFF = counter++
COFACTOR = counter++
CONDENSE = counter++
CONJ = counter++
CONTRACT = counter++
COS = counter++
COSH = counter++
DECOMP = counter++
DEFINT = counter++
DEGREE = counter++
DENOMINATOR = counter++
DERIVATIVE = counter++
DET = counter++
DIM = counter++
DIRAC = counter++
DISPLAY = counter++
DIVISORS = counter++
DO = counter++
DOT = counter++
DRAW = counter++
DSOLVE = counter++
EIGEN = counter++
EIGENVAL = counter++
EIGENVEC = counter++
ERF = counter++
ERFC = counter++
EVAL = counter++
EXP = counter++
EXPAND = counter++
EXPCOS = counter++
EXPSIN = counter++
FACTOR = counter++
FACTORIAL = counter++
FACTORPOLY = counter++
FILTER = counter++
FLOATF = counter++
FLOOR = counter++
FOR = counter++
GAMMA = counter++
GCD = counter++
HERMITE = counter++
HILBERT = counter++
IMAG = counter++
INDEX = counter++
INNER = counter++
INTEGRAL = counter++
INV = counter++
INVG = counter++
ISINTEGER = counter++
ISPRIME = counter++
LAGUERRE = counter++
#	LAPLACE = counter++
LCM = counter++
LEADING = counter++
LEGENDRE = counter++
LOG = counter++
MAG = counter++
MOD = counter++
MULTIPLY = counter++
NOT = counter++
NROOTS = counter++
NUMBER = counter++
NUMERATOR = counter++
OPERATOR = counter++
OR = counter++
OUTER = counter++
POLAR = counter++
POWER = counter++
PRIME = counter++
PRINT = counter++
PRODUCT = counter++
QUOTE = counter++
QUOTIENT = counter++
RANK = counter++
RATIONALIZE = counter++
REAL = counter++
YYRECT = counter++
ROOTS = counter++
SETQ = counter++
SGN = counter++
SIMPLIFY = counter++
SIN = counter++
SINH = counter++
SQRT = counter++
STOP = counter++
SUBST = counter++
SUM = counter++
TAN = counter++
TANH = counter++
TAYLOR = counter++
TEST = counter++
TESTEQ = counter++
TESTGE = counter++
TESTGT = counter++
TESTLE = counter++
TESTLT = counter++
TRANSPOSE = counter++
UNIT = counter++
ZERO = counter++

NIL = counter++	# nil goes here, after standard functions

AUTOEXPAND = counter++
BAKE = counter++
LAST = counter++
TRACE = counter++
TTY = counter++

YYE = counter++

DRAWX = counter++	# special purpose internal symbols
METAA = counter++
METAB = counter++
METAX = counter++
SECRETX = counter++

PI = counter++
SYMBOL_A = counter++
SYMBOL_B = counter++
SYMBOL_C = counter++
SYMBOL_D = counter++
SYMBOL_I = counter++
SYMBOL_J = counter++
SYMBOL_N = counter++
SYMBOL_R = counter++
SYMBOL_S = counter++
SYMBOL_T = counter++
SYMBOL_X = counter++
SYMBOL_Y = counter++
SYMBOL_Z = counter++

C1 = counter++
C2 = counter++
C3 = counter++
C4 = counter++
C5 = counter++
C6 = counter++

USR_SYMBOLS = counter++	# this must be last

E = YYE

# TOS cannot be arbitrarily large because the OS seg faults on deep recursion.
# For example, a circular evaluation like x=x+1 can cause a seg fault.
# At this setting (100,000) the evaluation stack overruns before seg fault.

TOS = 100000

BUF = 10000

MAX_PROGRAM_SIZE = 100001
MAXPRIMETAB = 10000


primetab = [2]
i = 3
while primetab.length < MAXPRIMETAB
	j = 0
	ceil = Math.sqrt(i)
	while j < primetab.length and primetab[j] <= ceil
		if i % primetab[j] == 0
			j = -1
			break
		j++
	if j != -1
		primetab.push(i)
	i += 2


#define _USE_MATH_DEFINES // for MS C++

MAXDIM = 24

class tensor
	ndim: 0
	dim: null
	nelem: 0
	elem: null #U *elem[1]

	constructor: ->
		@dim = (0 for [0..MAXDIM])
		@elem = []


class display
	h: 0
	w: 0
	n: 0
	a: [] # will contain an array of c,x,y (color,x,y)


class text_metric
	ascent: 0
	descent: 0
	width: 0


tos = 0 # top of stack
expanding = 0
fmt_x = 0
fmt_index = 0
fmt_level = 0
verbosing = 0

primetab = []
primetab[MAXPRIMETAB] = 0

esc_flag = 0
draw_flag = 0
mtotal = 0
trigmode = 0
logbuf = ""
program_buf = ""
symtab = [] # will contain U
binding = [] # will contain *U
arglist = [] # will contain U
stack = [] # will contain *U
frame = 0
p0 = null # will contain U
p1 = null # will contain U
p2 = null # will contain U
p3 = null # will contain U
p4 = null # will contain U
p5 = null # will contain U
p6 = null # will contain U
p7 = null # will contain U
p8 = null # will contain U
p9 = null # will contain U

zero = null # will contain U
one = null # will contain U
imaginaryunit = null # will contain U

symtab = [] # will contain U
out_buf = ""
out_count = 0
test_flag = 0
draw_stop_return = null # extern jmp_buf ?????

symbol = (x) -> (symtab[x])
iscons = (p) -> (p.k == CONS)
isrational = (p) -> (p.k == NUM)
isdouble = (p) -> (p.k == DOUBLE)
isnum = (p) -> (isrational(p) || isdouble(p))
isstr = (p) -> (p.k == STR)
istensor = (p) -> (if !p? then debugger else p.k == TENSOR)
issymbol = (p) -> (p.k == SYM)
iskeyword = (p) -> (issymbol(p) && symnum(p) < NIL)

car = (p) -> if iscons(p) then p.cons.car else symbol(NIL)
cdr = (p) -> if iscons(p) then p.cons.cdr else symbol(NIL)
caar = (p) -> car(car(p))
cadr = (p) -> car(cdr(p))
cdar = (p) -> cdr(car(p))
cddr = (p) -> cdr(cdr(p))
caadr = (p) -> car(car(cdr(p)))
caddr = (p) -> car(cdr(cdr(p)))
cadar = (p) -> car(cdr(car(p)))
cdadr = (p) -> cdr(car(cdr(p)))
cddar = (p) -> cdr(cdr(car(p)))
cdddr = (p) -> cdr(cdr(cdr(p)))
caaddr = (p) -> car(car(cdr(cdr(p))))
cadadr = (p) -> car(cdr(car(cdr(p))))
caddar = (p) -> car(cdr(cdr(car(p))))
cdaddr = (p) -> cdr(car(cdr(cdr(p))))
cadddr = (p) -> car(cdr(cdr(cdr(p))))
cddddr = (p) -> cdr(cdr(cdr(cdr(p))))
caddddr = (p) -> car(cdr(cdr(cdr(cdr(p)))))
cadaddr = (p) -> car(cdr(car(cdr(cdr(p)))))
cddaddr = (p) -> cdr(cdr(car(cdr(cdr(p)))))
caddadr = (p) -> car(cdr(cdr(car(cdr(p)))))
cdddaddr = (p) -> cdr(cdr(cdr(car(cdr(cdr(p))))))
caddaddr = (p) -> car(cdr(cdr(car(cdr(cdr(p))))))

isadd = (p) -> (car(p) == symbol(ADD))
ispower = (p) -> (car(p) == symbol(POWER))
isfactorial = (p) -> (car(p) == symbol(FACTORIAL))

MSIGN = (p) ->
	if p.isPositive()
		return 1
	else if p.isZero()
		return 0
	else
		return -1

MLENGTH = (p) -> p.toString.length

MZERO = (p) -> p.isZero()
MEQUAL = (p, n) ->
	if !p?
		debugger
	p.equals(n)

$ = (exports ? this)

$.car = car
$.cdr = cdr


$.symbol         = symbol  
$.iscons         = iscons  
$.isrational     = isrational      
$.isdouble       = isdouble    
$.isnum          = isnum 
$.isstr          = isstr 
$.istensor       = istensor    
$.issymbol       = issymbol    
$.iskeyword      = iskeyword   




$.CONS =        CONS      
$.NUM =         NUM     
$.DOUBLE =      DOUBLE        
$.STR =         STR     
$.TENSOR =      TENSOR        
$.SYM =         SYM     


$.ABS            = ABS        
$.ADD            = ADD        
$.ADJ            = ADJ        
$.AND            = AND        
$.ARCCOS         = ARCCOS           
$.ARCCOSH        = ARCCOSH            
$.ARCSIN         = ARCSIN           
$.ARCSINH        = ARCSINH            
$.ARCTAN         = ARCTAN           
$.ARCTANH        = ARCTANH            
$.ARG            = ARG        
$.ATOMIZE        = ATOMIZE            
$.BESSELJ        = BESSELJ            
$.BESSELY        = BESSELY            
$.BINDING        = BINDING            
$.BINOMIAL       = BINOMIAL             
$.CEILING        = CEILING            
$.CHECK          = CHECK          
$.CHOOSE         = CHOOSE           
$.CIRCEXP        = CIRCEXP            
$.CLEAR          = CLEAR          
$.CLOCK          = CLOCK          
$.COEFF          = COEFF          
$.COFACTOR       = COFACTOR             
$.CONDENSE       = CONDENSE             
$.CONJ           = CONJ         
$.CONTRACT       = CONTRACT             
$.COS            = COS        
$.COSH           = COSH         
$.DECOMP         = DECOMP           
$.DEFINT         = DEFINT           
$.DEGREE         = DEGREE           
$.DENOMINATOR    = DENOMINATOR                
$.DERIVATIVE     = DERIVATIVE               
$.DET            = DET        
$.DIM            = DIM        
$.DIRAC          = DIRAC          
$.DISPLAY        = DISPLAY            
$.DIVISORS       = DIVISORS             
$.DO             = DO       
$.DOT            = DOT        
$.DRAW           = DRAW         
$.DSOLVE         = DSOLVE           
$.EIGEN          = EIGEN          
$.EIGENVAL       = EIGENVAL             
$.EIGENVEC       = EIGENVEC             
$.ERF            = ERF        
$.ERFC           = ERFC         
$.EVAL           = EVAL         
$.EXP            = EXP        
$.EXPAND         = EXPAND           
$.EXPCOS         = EXPCOS           
$.EXPSIN         = EXPSIN           
$.FACTOR         = FACTOR           
$.FACTORIAL      = FACTORIAL              
$.FACTORPOLY     = FACTORPOLY               
$.FILTER         = FILTER           
$.FLOATF         = FLOATF           
$.FLOOR          = FLOOR          
$.FOR            = FOR        
$.GAMMA          = GAMMA          
$.GCD            = GCD        
$.HERMITE        = HERMITE            
$.HILBERT        = HILBERT            
$.IMAG           = IMAG         
$.INDEX          = INDEX          
$.INNER          = INNER          
$.INTEGRAL       = INTEGRAL             
$.INV            = INV        
$.INVG           = INVG         
$.ISINTEGER      = ISINTEGER              
$.ISPRIME        = ISPRIME            
$.LAGUERRE       = LAGUERRE             
# $.#	LAPLACE      = #	LAPLACE              
$.LCM            = LCM        
$.LEADING        = LEADING            
$.LEGENDRE       = LEGENDRE             
$.LOG            = LOG        
$.MAG            = MAG        
$.MOD            = MOD        
$.MULTIPLY       = MULTIPLY             
$.NOT            = NOT        
$.NROOTS         = NROOTS           
$.NUMBER         = NUMBER           
$.NUMERATOR      = NUMERATOR              
$.OPERATOR       = OPERATOR             
$.OR             = OR       
$.OUTER          = OUTER          
$.POLAR          = POLAR          
$.POWER          = POWER          
$.PRIME          = PRIME          
$.PRINT          = PRINT          
$.PRODUCT        = PRODUCT            
$.QUOTE          = QUOTE          
$.QUOTIENT       = QUOTIENT             
$.RANK           = RANK         
$.RATIONALIZE    = RATIONALIZE                
$.REAL           = REAL         
$.YYRECT         = YYRECT           
$.ROOTS          = ROOTS          
$.SETQ           = SETQ         
$.SGN            = SGN        
$.SIMPLIFY       = SIMPLIFY             
$.SIN            = SIN        
$.SINH           = SINH         
$.SQRT           = SQRT         
$.STOP           = STOP         
$.SUBST          = SUBST          
$.SUM            = SUM        
$.TAN            = TAN        
$.TANH           = TANH         
$.TAYLOR         = TAYLOR           
$.TEST           = TEST         
$.TESTEQ         = TESTEQ           
$.TESTGE         = TESTGE           
$.TESTGT         = TESTGT           
$.TESTLE         = TESTLE           
$.TESTLT         = TESTLT           
$.TRANSPOSE      = TRANSPOSE              
$.UNIT           = UNIT         
$.ZERO           = ZERO         
$.NIL            = NIL        
$.AUTOEXPAND     = AUTOEXPAND               
$.BAKE           = BAKE         
$.LAST           = LAST         
$.TRACE          = TRACE          
$.TTY            = TTY        
$.YYE            = YYE        
$.DRAWX          = DRAWX          
$.METAA          = METAA          
$.METAB          = METAB          
$.METAX          = METAX          
$.SECRETX        = SECRETX            
$.PI             = PI       
$.SYMBOL_A       = SYMBOL_A             
$.SYMBOL_B       = SYMBOL_B             
$.SYMBOL_C       = SYMBOL_C             
$.SYMBOL_D       = SYMBOL_D             
$.SYMBOL_I       = SYMBOL_I             
$.SYMBOL_J       = SYMBOL_J             
$.SYMBOL_N       = SYMBOL_N             
$.SYMBOL_R       = SYMBOL_R             
$.SYMBOL_S       = SYMBOL_S             
$.SYMBOL_T       = SYMBOL_T             
$.SYMBOL_X       = SYMBOL_X             
$.SYMBOL_Y       = SYMBOL_Y             
$.SYMBOL_Z       = SYMBOL_Z             
$.C1             = C1       
$.C2             = C2       
$.C3             = C3       
$.C4             = C4       
$.C5             = C5       
$.C6             = C6       
$.USR_SYMBOLS    = USR_SYMBOLS                