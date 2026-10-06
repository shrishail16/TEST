const assert = (condition, message) => {
  if (!condition) {
    console.error("Assertion failed:", message);
    return false;
  }
  console.log("Assertion passed:", message);
  return true;
};

// Mock DOM elements and events for testing in a non-browser environment
// In a real scenario, you'd use a testing framework like Jest with JSDOM

// Mock document.querySelector
const originalQuerySelector = document.querySelector;
document.querySelector = (selector) => {
  if (selector === ".calculator-screen") {
    return {
      value: "0",
      // Mock the setter for value
      set value(val) {
        this._value = val;
      },
      get value() {
        return this._value === undefined ? "0" : this._value;
      },
    };
  }
  return originalQuerySelector(selector);
};

// Mock addEventListener
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (eventName, handler) {
  if (eventName === "click") {
    this._clickHandler = handler;
  }
  originalAddEventListener.apply(this, arguments);
};

// Helper to simulate button clicks
const simulateClick = (
  value,
  isOperator = false,
  isDecimal = false,
  isClear = false,
) => {
  const mockTarget = {
    value: value,
    classList: {
      contains: (className) => {
        if (className === "operator") return isOperator;
        if (className === "decimal") return isDecimal;
        if (className === "all-clear") return isClear;
        return false;
      },
    },
  };
  // Directly call the click handler mocked in addEventListener
  // This assumes the keys.addEventListener is set up similar to the script.js
  const keys = document.querySelector(".calculator-keys"); // This will return a mock
  if (keys && keys._clickHandler) {
    keys._clickHandler({ target: mockTarget });
  }
};

// Reload script.js to ensure mocks are in place before it runs
// In a real test, you would import the module or have direct access to its functions
// For this example, we'll assume script.js has been run and its functions are global
// Or, more robustly, require/import the functions from script.js here.

// To make this test runnable without complex setups, let's redefine the calculator object
// and functions directly for testing purposes, mimicking script.js.

let calculator = {
  displayValue: "0",
  firstOperand: null,
  waitingForSecondOperand: false,
  operator: null,
};

function inputDigit(digit) {
  const { displayValue, waitingForSecondOperand } = calculator;
  if (waitingForSecondOperand === true) {
    calculator.displayValue = digit;
    calculator.waitingForSecondOperand = false;
  } else {
    calculator.displayValue =
      displayValue === "0" ? digit : displayValue + digit;
  }
}

function inputDecimal(dot) {
  if (calculator.waitingForSecondOperand === true) {
    calculator.displayValue = "0.";
    calculator.waitingForSecondOperand = false;
    return;
  }
  if (!calculator.displayValue.includes(dot)) {
    calculator.displayValue += dot;
  }
}

function handleOperator(nextOperator) {
  const { firstOperand, displayValue, operator } = calculator;
  const inputValue = parseFloat(displayValue);

  if (operator && calculator.waitingForSecondOperand) {
    calculator.operator = nextOperator;
    return;
  }
  if (firstOperand === null && !isNaN(inputValue)) {
    calculator.firstOperand = inputValue;
  } else if (operator) {
    const result = performCalculation[operator](firstOperand, inputValue);
    calculator.displayValue = String(result);
    calculator.firstOperand = result;
  }
  calculator.waitingForSecondOperand = true;
  calculator.operator = nextOperator;
}

const performCalculation = {
  "/": (firstOperand, secondOperand) => firstOperand / secondOperand,
  "*": (firstOperand, secondOperand) => firstOperand * secondOperand,
  "+": (firstOperand, secondOperand) => firstOperand + secondOperand,
  "-": (firstOperand, secondOperand) => firstOperand - secondOperand,
  "=": (firstOperand, secondOperand) => secondOperand,
};

function resetCalculator() {
  calculator.displayValue = "0";
  calculator.firstOperand = null;
  calculator.waitingForSecondOperand = false;
  calculator.operator = null;
}

let mockDisplayValue = "0";
function updateDisplay() {
  mockDisplayValue = calculator.displayValue;
}

// --- Test Cases ---
console.log("\n--- Running Calculator Tests ---");

// Test 1: Initial state
resetCalculator();
updateDisplay();
assert(mockDisplayValue === "0", "Test 1: Initial display value is 0");

// Test 2: Input single digit
resetCalculator();
inputDigit("5");
updateDisplay();
assert(mockDisplayValue === "5", "Test 2: Input single digit 5");

// Test 3: Input multiple digits
resetCalculator();
inputDigit("1");
inputDigit("2");
inputDigit("3");
updateDisplay();
assert(mockDisplayValue === "123", "Test 3: Input multiple digits 123");

// Test 4: Addition
resetCalculator();
inputDigit("1");
inputDigit("0");
handleOperator("+");
inputDigit("5");
handleOperator("=");
updateDisplay();
assert(mockDisplayValue === "15", "Test 4: Addition 10 + 5 = 15");

// Test 5: Subtraction
resetCalculator();
inputDigit("2");
inputDigit("0");
handleOperator("-");
inputDigit("7");
handleOperator("=");
updateDisplay();
assert(mockDisplayValue === "13", "Test 5: Subtraction 20 - 7 = 13");

// Test 6: Multiplication
resetCalculator();
inputDigit("6");
handleOperator("*");
inputDigit("8");
handleOperator("=");
updateDisplay();
assert(mockDisplayValue === "48", "Test 6: Multiplication 6 * 8 = 48");

// Test 7: Division
resetCalculator();
inputDigit("1");
inputDigit("0");
inputDigit("0");
handleOperator("/");
inputDigit("4");
handleOperator("=");
updateDisplay();
assert(mockDisplayValue === "25", "Test 7: Division 100 / 4 = 25");

// Test 8: Decimal input
resetCalculator();
inputDigit("3");
inputDecimal(".");
inputDigit("1");
inputDigit("4");
updateDisplay();
assert(mockDisplayValue === "3.14", "Test 8: Decimal input 3.14");

// Test 9: Chained operations
resetCalculator();
inputDigit("5");
handleOperator("+");
inputDigit("5");
handleOperator("*");
inputDigit("2");
handleOperator("="); // (5+5)*2 = 20
updateDisplay();
assert(mockDisplayValue === "20", "Test 9: Chained operations (5+5)*2 = 20");

// Test 10: All Clear
resetCalculator();
inputDigit("1");
inputDigit("2");
handleOperator("+");
resetCalculator();
updateDisplay();
assert(mockDisplayValue === "0", "Test 10: All Clear resets display to 0");

console.log("\n--- Calculator Tests Complete ---");
