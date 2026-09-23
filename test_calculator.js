/**
 * Borrowing Power Calculator Test Suite
 */

const assert = require('assert');
const {
    calculateBorrowingPower,
    getTax,
    getHEM
} = require('./borrowingCalculator');
const url = process.env.API_URL;

describe('Term Deposit Calculator Tests', () => {
/*
**  getTax function tests
**/

    it('should return the correct income and tax from the API where income > 100000, < 50000', async () => {
        const income = 180000;
        const response = await fetch(`${url}tax?income=${income}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        const result = await response.json();

        assert.strictEqual(result.income, 180000, 'Income should be 180000');
        assert.strictEqual(result.tax, 45000, 'Tax should be 45000');
    });

    it('should return the correct income and tax from the API where income > 50000, < 20000', async () => {
        const income = 55000;
        const response = await fetch(`${url}tax?income=${income}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        const result = await response.json();

        assert.strictEqual(result.income, 55000, 'Income should be 55000');
        assert.strictEqual(result.tax, 5750, 'Tax should be 5750');
    });

    it('should return the correct income and tax from the API where income > 20000, > 0', async () => {
        const income = 24000;
        const response = await fetch(`${url}tax?income=${income}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        const result = await response.json();

        assert.strictEqual(result.income, 24000, 'Income should be 24000');
        assert.strictEqual(result.tax, 600, 'Tax should be 600');
    });

    it("should reject blank inputs", async function () {
        await assert.rejects(
            getTax(),
            {
                name: "TypeError",
                message: "Income must be a valid number."
            }
        );
    });

    it("should throw TypeError when income is not a valid number", async function () {

        await assert.rejects(
            getTax(NaN),
            {
                name: "TypeError",
                message: "Income must be a valid number."
            }
        );

    });

    it("should reject Infinity", async function () {
        await assert.rejects(
            getTax(Infinity),
            {
                name: "TypeError",
                message: "Income must be a valid number."
            }
        );
    });

    it("should reject a string", async function () {
        await assert.rejects(
            getTax("100000"),
            {
                name: "TypeError",
                message: "Income must be a valid number."
            }
        );
    });

    it("should reject zero income", async function () {
        await assert.rejects(
            getTax(0),
            {
                name: "RangeError",
                message: "Income must be greater than zero"
            }
        );
    });

    it("should reject negative income", async function () {
        await assert.rejects(
            getTax(-100),
            {
                name: "RangeError",
                message: "Income must be greater than zero"
            }
        );
    });

    it("should reject income above the maximum", async function () {
        await assert.rejects(
            getTax(1000000001),
            {
                name: "RangeError",
                message: "Income cannot be higher than 1,000,000,000"
            }
        );
    });

/*
**  getHEM function tests
**/

    it('should return the correct income and dependents from API', async () => {
        const income = 100000;
        const dependents = 1;
        const response = await fetch(`${url}hem?income=${income}&dependents=${dependents}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        const result = await response.json();

        assert.strictEqual(result.income, 100000, 'Income should be 100000');
        assert.strictEqual(result.dependents, 1, 'Dependents should be 1');
        assert.strictEqual(result.hem, 2700, 'Hem should be 2700');
    });

    it("should reject blank inputs", async function () {
        await assert.rejects(
            getHEM(120000,),
            {
                name: "TypeError",
                message: "Dependents must be a valid number."
            }
        );
    });

    it("should throw TypeError when dependents is not a valid number", async function () {

        await assert.rejects(
            getHEM(120000, NaN),
            {
                name: "TypeError",
                message: "Dependents must be a valid number."
            }
        );

    });

    it("should reject Infinity", async function () {
        await assert.rejects(
            getHEM(120000, Infinity),
            {
                name: "TypeError",
                message: "Dependents must be a valid number."
            }
        );
    });

    it("should reject a string", async function () {
        await assert.rejects(
            getHEM(120000, "1"),
            {
                name: "TypeError",
                message: "Dependents must be a valid number."
            }
        );
    });

    it("should reject negative dependents", async function () {
        await assert.rejects(
            getHEM(120000, -1),
            {
                name: "RangeError",
                message: "Dependents cannot be negative"
            }
        );
    });

    it("should reject >3 dependents", async function () {
        await assert.rejects(
            getHEM(120000, 4),
            {
                name: "RangeError",
                message: "Dependents cannot be more than 3"
            }
        );
    });

/*
**  calculateBorrowingPower function tests
**/
    it('should calculate the max loan amount and borrowing power when HEM < income', async () => {
        const result = await calculateBorrowingPower(50000, 2, 3000, 10000, 10);
        assert.strictEqual(result.maxLoanAmount, 23140.47, 'Max loan amount should be 23140.47');
        assert.strictEqual(result.monthlyRepayment, 491.67, 'Max monthly repayment should be 491.67');
    });

    it('should calculate the max loan amount and borrowing power when HEM > income', async () => {
        const result = await calculateBorrowingPower(61000, 1, 3000, 10000, 10);
        assert.strictEqual(result.maxLoanAmount, 55497.91, 'Max loan amount should be 55497.91');
        assert.strictEqual(result.monthlyRepayment, 1179.17, 'Max monthly repayment should be 1179.17');
    });

    it('should return 0 when user cannot afford loan', async () => {
        const result = await calculateBorrowingPower(30000, 3, 4000, 5000, 10);
        assert.strictEqual(result.maxLoanAmount, 0);
        assert.strictEqual(result.monthlyRepayment, 0);
    });

    it("should reject invalid inputs for expenses", async function () {
        await assert.rejects(
            calculateBorrowingPower(50000, 2, " ", 10000, 10),
            {
                name: "TypeError",
                message: "Monthly expenses must be a valid number."
            }
        );
    });

    it("should reject invalid inputs for creditLimits", async function () {
        await assert.rejects(
            calculateBorrowingPower(50000, 2, 30000, "", 10),
            {
                name: "TypeError",
                message: "Credit Card Limits must be a valid number."
            }
        );
    });

    it("should reject negative expenses", async function () {
        await assert.rejects(
            calculateBorrowingPower(50000, 2, -5000, 3000, 10),
            {
                name: "RangeError",
                message: "Monthly expenses cannot be negative"
            }
        );
    });

    it("should reject negative creditLimits", async function () {
        await assert.rejects(
            calculateBorrowingPower(50000, 2, 10000, -10000, 10),
            {
                name: "RangeError",
                message: "Credit Card Limits cannot be negative"
            }
        );
    });

/*
** API status function tests
**/

    it('should return status 200', async () => {
        const response = await fetch(`${url}tax?income=2000`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        assert.strictEqual(response.status, 200, 'Should be status 200');
        assert.strictEqual(response.statusText, "OK", 'Should say OK');
    });

    it('should return status 400', async () => {
        const response = await fetch(`${url}tax?income=`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        assert.strictEqual(response.status, 400, 'Should be status 400');
        assert.strictEqual(response.statusText, "Bad Request", 'Should say Bad Request');
    });

    it('should return status 401', async () => {
        const response = await fetch(`${url}tax?income=100000`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN + 1
            }
        });

        assert.strictEqual(response.status, 401, 'Should be status 401');
        assert.strictEqual(response.statusText, "Unauthorized", 'Unauthorized');
    });

    it('should return status 404', async () => {
        const response = await fetch(`${url}tax=1`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        assert.strictEqual(response.status, 404, 'Should be status 404');
        assert.strictEqual(response.statusText, "Not Found", 'Not Found');
    });

    it('should return status 405', async () => {
        const response = await fetch(`${url}tax?income=100000`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

        assert.strictEqual(response.status, 405, 'Should be status 405');
        assert.strictEqual(response.statusText, "Method Not Allowed", 'Should say Method Not Allowed');
    });

});

