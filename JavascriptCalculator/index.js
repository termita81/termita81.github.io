const expressionElement = document.getElementById('expression');
const currentElement = document.getElementById('current');

document.getElementById('buttons').addEventListener('click', (event) => {
  if (event.target.nodeName !== 'BUTTON') return;
  const key = event.target.dataset.content;
  calc.doKey(key);
  updateDisplay(calc);
});

function updateDisplay(calc) {
  const { current, expression } = calc.getState();
  expressionElement.innerText = expression;
  currentElement.innerText = current;
}

// new Calculator().doKey(1).doKey(2).doKey(3).current == 1;

const precision = 9;
const calc = new ImmediateCalculator(precision);
updateDisplay(calc)

// 'c1.00001+.00001='.split('').forEach(key => calc.doKey(key))
// alert(JSON.stringify(calc.getState(), null, 2))
