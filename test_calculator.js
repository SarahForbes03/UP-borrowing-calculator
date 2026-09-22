/**
 * Borrowing Power Calculator Test Suite
 */


const assert = require('assert'); 
const {calculateBorrowingPower} = require('./borrowingCalculator');
const {getTax} = require('./borrowingCalculator');
const {getHEM} = require('./borrowingCalculator');
const url = process.env.API_URL;

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
    const response = await fetch(url+"tax?income=" + income, {
      headers: {
        "Authorization": "Bearer " + process.env.BEARER_TOKEN
      }
    });

    assert.strictEqual(response.status, 200,'Should be status 200');
    assert.strictEqual(response.statusText, "OK",'Should say OK');

    const result = await response.json();

    assert.strictEqual(result.income, 120000,'Income should be 120000');
    assert.strictEqual(result.tax, 24000,'Tax should be 24000');
  });

  it('should return the correct income and dependents from API', async()=>{
    const income = 120000;
    const dependents = 2;
    const response = await fetch(url + "hem?income=" + income + "&dependents=" + dependents, {
      headers: {
        "Authorization": "Bearer " + process.env.BEARER_TOKEN
      }
    });

    const result = await response.json();
    assert.strictEqual(result.income, 120000,'Income should be 120000');
    assert.strictEqual(result.dependents, 2,'Dependents should be 2');
    assert.strictEqual(result.hem, 3100,'Hem should be 3100');
  });

  it('should return status 400', async () => {
    const response = await fetch(url+"tax?income=",{
      headers: {
        "Authorization": "Bearer " + process.env.BEARER_TOKEN
      }
    });

    assert.strictEqual(response.status, 400,'Should be status 400');
    assert.strictEqual(response.statusText, "Bad Request",'Should say Bad Request');
  });

  it('should return status 401', async () => {
    const response = await fetch(url+"tax?income=",{
      headers: {
        "Authorization": "Bearer " + process.env.BEARER_TOKEN+1
      }
    });

    assert.strictEqual(response.status, 401,'Should be status 401');
    assert.strictEqual(response.statusText, "Unauthorized",'Unauthorized');
  });

  it('should return status 404', async () => {
    const response = await fetch(url+"tax1", {
      headers: {
        "Authorization": "Bearer " + process.env.BEARER_TOKEN
      }
    });

    assert.strictEqual(response.status, 404,'Should be status 404');
    assert.strictEqual(response.statusText, "Not Found",'Not Found');
  });

  it('should return status 405', async () => {
    const response = await fetch(url+"tax=", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.BEARER_TOKEN
      }
    });

    assert.strictEqual(response.status, 405,'Should be status 405');
    assert.strictEqual(response.statusText, "Method Not Allowed",'Should say Method Not Allowed');
  });


});

