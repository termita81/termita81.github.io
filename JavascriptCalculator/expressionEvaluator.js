function evaluate(expression) {
  return 1;
}

function test(actual, expected, info) {
  if (actual != expected) {
    console.error(
      `${info ? info + ': ' : ''}expected '${expected}', actual '${actual}'`
    );
  }
}

console.log('what!!?!?');
test(1, 3);
test(1, 1);
test(1, 3, 'a');

export default evaluate;
