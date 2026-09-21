/**
 * Borrowing Power Calculator Test Suite
 */


const assert = require('assert'); 
const {calculateBorrowingPower} = require('./borrowingCalculator');
const {getTax} = require('./borrowingCalculator');

describe('Term Deposit Calculator Tests', () => {

  /*it('should calculate borrowing power for standard values', async () => {
    const result = await calculateBorrowingPower(120000, 2, 3000, 10000, 7.5);
    assert.ok(result.maxLoanAmount > 0, 'Should yield a positive borrowing power amount');
    assert.strictEqual(result.monthlyRepayment, 4200);
  });*/

  /*it('should return 0 for invalid negative inputs', async () => {
    const result = await calculateBorrowingPower(30000, 3, 4000, 5000, 7.5);
    assert.strictEqual(result.maxLoanAmount, 0);
    assert.strictEqual(result.monthlyRepayment, 0);
  });*/

  it('should calculate tax', async () => {
    const income = 120000;
    const tax = await getTax(income);

    assert.strictEqual(income, 120000);
    assert.strictEqual(tax, 24000);
  });

});

