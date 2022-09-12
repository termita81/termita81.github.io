class ImmediateCalculator {
  current = '0';
  expression = '';
  operator = '';

  constructor(precision) {
    this.precision = precision;
    this.doClearAll();
  }

  
  doKey(key) {
    if ('1234567890.'.includes(key)) {
      this.doDigit(key);
    } else if (key === '+-') {
      this.doChangeSign();
    } else if (key === 'c') {
      this.doClearAll();
    } else if (key === 'ce') {
      this.doClearCurrent();
    } else if ('+-*/'.includes(key)) {
      this.doOperator(key);
    } else if (key === '=') {
      this.doEqual();
    }
  }

  doDigit(digit) {
    // just computed some things, and started a new computation by typing in a digit
    if (this.expression !== '' && this.operator === '') {
      this.doClearAll();
    }
    // prevent multiple decimal points
    if (digit === '.') {
      if (this.current.includes('.')) return; // if (this.current === '') { this.current = '0.'; return; }
    }
    // prevent multiple leading zeroes
    if (digit === '0' && this.current === '0') return;
    // omit any leading zero in current
    this.current =
      this.current === '0' && digit !== '.' ? digit : this.current + digit;
  }

  doOperator(operator) {
    // compute; this might not result in anything, but no error should be thrown
    this.compute();
    // if previously entering any number into current
    if (this.current !== '') {
      // move to expression
      this.expression = this.current;
      //  clear current
      this.current = '';
    }
    // set operator; this can be overwritten by clicking multiple operators in succession
    this.operator = operator;
  }

  doChangeSign() {
    // parse into a temporary variable
    let temp = parseFloat(this.current);
    // return if error parsing (shouldn't be the case)
    if (isNaN(temp)) return;
    // change sign
    temp *= -1;
    // convert temp back to string
    this.current = temp + '';
  }

  doEqual() {
    this.compute();
  }

  doClearAll() {
    this.current = '0';
    this.expression = '';
    this.operator = '';
  }

  doClearCurrent() {
    this.current = '0';
  }

  operations = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '/': (a, b) => a / b,
    '*': (a, b) => a * b,
  };

  compute() {
    // try and parse current and expression
    let prev = parseFloat(this.expression);
    let crt = parseFloat(this.current);
    // return if we miss any operand or the operator
    if (isNaN(prev) || isNaN(crt) || !this.operator) return;

    // precision
    const precision = this.precision 
      ? Math.pow(10, this.precision) 
      : 0
    if (precision) {
      prev = parseInt((prev * precision).toFixed());
      crt = parseInt((crt * precision).toFixed());
    }
    // perform computation
    let result = this.operations[this.operator](prev, crt);
    // precision
    if (precision) {
      if (this.operator !== '/') {
        result /= precision;
        if (this.operator === '*') {
          result /= precision;
        }
      }
    }
    // reset all
    this.doClearAll();
    // but keep result of calculation
    this.expression = '' + result;
  }

  getState() {
    return {
      current: splitGroups(this.current),
      expression: splitGroups(this.expression) + this.operator,
    };
  }
}

function splitGroups(number) {
  const arr = number.split('');
  let decimalIndex = arr.indexOf('.');
  if (decimalIndex === -1) decimalIndex = arr.length;
  //     xxxx.yyyyy => x,xxx.yyyyy
  for (let i = decimalIndex; i > 0; i--) {
    if (decimalIndex !== i && (decimalIndex - i) % 3 === 0)
      arr.splice(i, 0, ',');
  }
  return arr.join('');
}
