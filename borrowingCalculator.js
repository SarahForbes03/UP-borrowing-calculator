/**
 * Borrowing Power Calculator
 * 
 * Gen's incomplete prototype. 
 * This currently calculates what a user can borrow over 30 years.
 * Currently this code uses placeholder methods for Tax and HEM values. 
 * 
 * TODO: Refactor the code to pull Tax and HEM values from an API call.
 * A server.js has been provided to supply these values.
 */
require('dotenv').config();
const url = process.env.API_URL;

// Global constant for loan simulation
// const LOAN_TERM_MONTHS = 360; // 30 Years
const LOAN_TERM_MONTHS = 60; // 5 Years
const INTEREST_RATE = 7.0; // 7.0% baseline interest rate
const ASSESSMENT_RATE_BUFFER = 3.0; // 3.0% buffer added to interest rates

/**
 * Retrieves the annual tax amount for a given income from the API
 *
 * @param {number} income - Gross annual income
 * @returns {Promise<number>} Annual tax amount
 * @throws {TypeError} If income is not a valid number
 * @throws {RangeError} If income is outside the accepted range
 * @throws {Error} If the API request fails
 */
async function getTax(income) {
    // Validate income is a number.
    if (!Number.isFinite(income)) {
        throw new TypeError("Income must be a valid number.");
    }

    // Check income is positive
    if (income <= 0){
        throw new RangeError('Income must be greater than zero');
    }

    // Prevent unrealistically large income values.
    if (income > 1000000000){
        throw new RangeError('Income cannot be higher than 1,000,000,000');
    }

    try {
        // Request the tax amount from the API.
        const response = await fetch(`${url}tax?income=${income}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

            // console.log("Tax Response status:", response.status + " " + response.statusText);

        // Check http response status is successful.
        if (!response.ok) {
            throw new Error(`Tax error Response status: ${response.status + " " + response.statusText}`);
        }

        // Parse the API response and return the tax value.
        const result = await response.json();
            // console.log("Tax API response:", result);

        return result.tax;

    } catch (error) {
        // Log the error before passing it back to the caller.
        console.error(error.name);
        console.error(error.message);
        throw error;
    }
}

/**
 * Retrieves the Household Expenditure Measure (HEM) from the API.
 *
 *
 * @param {number} income - Gross annual income
 * @param {number} dependents - Number of financial dependents
 * @returns {Promise<number>} Monthly HEM amount
 * @throws {TypeError} If income or dependents are not valid numbers
 * @throws {RangeError} If income or dependents are outside the accepted range
 * @throws {Error} If the API request fails
 *
 */
async function getHEM(income, dependents) {
    // Validate income is a number.
    if (!Number.isFinite(income)) {
        throw new TypeError("Income must be a valid number.");
    }

    // Check income is positive.
    if (income <= 0){
        throw new RangeError('Income must be greater than zero');
    }

    // Validate dependents is a number.
    if (!Number.isFinite(dependents)) {
        throw new TypeError("Dependents must be a valid number.");
    }

    // Check dependents is not negative.
    if (dependents < 0){
        throw new RangeError('Dependents cannot be negative');
    }

    // Check dependents doesnt exceed maximum limit of 3.
    if (dependents > 3){
        throw new RangeError('Dependents cannot be more than 3');
    }

    try {
        // Request the HEM value from the API.
        const response = await fetch(`${url}hem?income=${income}&dependents=${dependents}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

            // console.log("HEM Response status:", response.status + " " + response.statusText);

        // Check http response status is successful.
        if (!response.ok) {
            throw new Error(`Response status: ${response.status + " " + response.statusText}`);
        }

        // Parse the API response and return the HEM value.
        const result = await response.json();
            // console.log("HEM API response:", result);

        return result.hem;

    } catch (error) {
        // Log the error before passing it back to the caller.
        console.error(error.name);
        console.error(error.message);
        throw error;
    }
}

/**
 * Calculates the total borrowing power amount and the monthly repayment configuration
 */
/**
 * The calculation:
 * 1. Retrieves annual tax from the API.
 * 2. Calculates net monthly income.
 * 3. Retrieves HEM from the API.
 * 4. Uses the greater of declared expenses and HEM.
 * 5. Deducts credit card liabilities.
 * 6. Calculates the maximum monthly repayment.
 * 7. Calculates the maximum loan amount using the loan term and assessment interest rate.
 *
 * @param {number} income - Gross annual income
 * @param {number} dependents - Number of financial dependents
 * @param {number} expenses - Declared monthly living expenses
 * @param {number} creditLimits - Total credit card limits
 * @param {number} annualAssessmentRate - Annual interest rate used for assessment
 * @returns {Promise<{monthlyRepayment: number, maxLoanAmount: number}>}
 */
async function calculateBorrowingPower(income, dependents, expenses, creditLimits, annualAssessmentRate) {
    // Validate the main calculation inputs.
    if (!Number.isFinite(income)) throw new TypeError("Income must be a valid number.");
    if (!Number.isFinite(dependents)) throw new TypeError("Dependents must be a valid number.");
    if (!Number.isFinite(expenses)) throw new TypeError("Monthly expenses must be a valid number.");
    if (expenses < 0){ throw new RangeError('Monthly expenses cannot be negative');}
    if (!Number.isFinite(creditLimits)) throw new TypeError("Credit Card Limits must be a valid number.");
    if (creditLimits < 0){ throw new RangeError('Credit Card Limits cannot be negative');}

    // 1. Calculate Net Monthly Income after tax deductions
    const annualTax = await getTax(income);
    const netMonthlyIncome = (income - annualTax) / 12;

    // 2. Determine living expenses (User declared expenses vs HEM baseline, whichever is higher)
    const baselineHEM = await getHEM(income, dependents);
    const totalLivingExpenses = Math.max(expenses, baselineHEM);

    // 3. Calculate credit card liability (~3% of total limits)
    const creditCardLiability = creditLimits * 0.03;

    // 4. Calculate monthly repayment capacity
    const maxMonthlyRepayment = netMonthlyIncome - totalLivingExpenses - creditCardLiability;

    // Return early if user cannot afford a loan at all
    if (maxMonthlyRepayment <= 0) {
        return { maxLoanAmount: 0, monthlyRepayment: 0 };
    }

    // 5. Calculate the monthly interest rate
    const monthlyRate = (annualAssessmentRate / 100) / 12;

    // 6. Calculate maximum borrowing power using the following formula:
    // P = M * (1 - (1 + R)^-N) / R
        // P = maximum loan amount
        // M = maximum monthly repayment
        // R = monthly interest rate
        // N = number of monthly repayments
    const maxLoanAmount = maxMonthlyRepayment * ((1 - Math.pow(1 + monthlyRate, - LOAN_TERM_MONTHS)) / monthlyRate);

    return {
        maxLoanAmount: Number(maxLoanAmount.toFixed(2)),
        monthlyRepayment: Number(maxMonthlyRepayment.toFixed(2))
    };
}

/**
 * Runs the calculator through the command line.
 *
 * Prompts the user for their financial information and displays the calculated borrowing power and monthly repayment.
 * @returns {Promise<void>}
 */
async function runConsoleMode() {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log("Loan Borrowing Power Calculator");
    console.log("===================================");

    rl.question("Gross Annual Income: $", async (income) => {
        rl.question("Number of Dependents: ", async (dependents) => {
            rl.question("Declared Monthly Expenses: $", async (expenses) => {
                rl.question("Total Credit Card Limits: $", async (creditLimits) => {

                    // Banks assess loans using base rate + buffer for safety
                    const assessmentRate = INTEREST_RATE + ASSESSMENT_RATE_BUFFER;

                    const result = await calculateBorrowingPower(
                        parseFloat(income),
                        parseInt(dependents),
                        parseFloat(expenses),
                        parseFloat(creditLimits),
                        assessmentRate
                    );

                    console.log("\n--- Calculation Summary ---");
                    console.log(`Maximum Borrowing Power at ${INTEREST_RATE}%: $${result.maxLoanAmount.toLocaleString()}`);
                    console.log(`Assumed Monthly Loan Repayment: $${result.monthlyRepayment.toLocaleString()} over 5 years`);
                    
                    rl.close();
                });
            });
        });
    });
}

if (require.main === module) {
    runConsoleMode();
}

module.exports = {
    calculateBorrowingPower,
    getTax,
    getHEM
};