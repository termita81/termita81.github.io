// import evaluate from './expressionEvaluator.js';

export default class Calculator {
  current = '';
  expression = '';
  operator = '';
  doKey(key) {
    if ('1234567890.'.includes(key)) return this.doDigit(key);
    if (key === '+-') return this; // !!!
    if (key === 'c') return this.doClear();
    if ('+-*/'.includes(key)) return this.doOperator(key);
    if (key === '=') return this.doEqual();
    return this;
  }
  doDigit(dgt) {
    if (this.operator != '') {
      this.operator = '';
    } else {
      this.current += dgt;
    }
    return this;
  }
  doOperator(op) {
    this.compute();
    return this;
  }
  doPlusMinus(op) {
    return this;
  }
  doEqual(op) {
    return this;
  }
  doClear() {
    this.current = '';
    this.expression = '';
    this.operator = '';
    return this;
  }
  compute() {}
  getState() {
    return { current: this.current, expression: this.expression };
  }
}
