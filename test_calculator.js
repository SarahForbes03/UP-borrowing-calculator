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

  it('should return the correct income and tax from the API', async () => {
    const income = 120000;
    const token = "pat_abcdefghijklmnopqrstuvwxyz0123456789";
    const url = "http://localhost:3000/api/tax?income=" + income;
    const response = await fetch(url, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    assert.strictEqual(response.status, 200);

    const result = await response.json();

    assert.strictEqual(result.income, 120000);
    assert.strictEqual(result.tax, 24000);
  });


});

