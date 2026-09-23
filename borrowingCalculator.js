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

// Global constant for mortgage simulation
const LOAN_TERM_MONTHS = 360; // 30 Years
const INTEREST_RATE = 7.0; // 7.0% baseline interest rate
const ASSESSMENT_RATE_BUFFER = 3.0; // 3.0% buffer added to interest rates

// Legacy placeholder functions to replace with API calls
async function getTax(income) {
    // validate income
    if (!Number.isFinite(income)) {
        throw new TypeError("Income must be a valid number.");
    }

    // check income is positive
    if (income <= 0){
        throw new RangeError('Income must be greater than zero');
    }

    // check income is positive
    if (income > 1000000000){
        throw new RangeError('Income cannot be higher than 1,000,000,000');
    }

    try {
        const response = await fetch(`${url}tax?income=${income}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

            // console.log("Tax Response status:", response.status + " " + response.statusText);

        // check http response status
        if (!response.ok) {
            throw new Error(`Tax error Response status: ${response.status + " " + response.statusText}`);
        }

        const result = await response.json();
            // console.log("Tax API response:", result);

        return result.tax;

    } catch (error) {
        console.error(error.name);
        console.error(error.message);
        throw error;
    }
}

async function getHEM(income, dependents) {
    // validate income
    if (!Number.isFinite(income)) {
        throw new TypeError("Income must be a valid number.");
    }

    // check income is positive
    if (income <= 0){
        throw new RangeError('Income must be greater than zero');
    }

    // validate dependents
    if (!Number.isFinite(dependents)) {
        throw new TypeError("Dependents must be a valid number.");
    }

    // check dependents is not negative
    if (dependents < 0){
        throw new RangeError('Dependents cannot be negative');
    }

    if (dependents > 3){
        throw new RangeError('Dependents cannot be more than 3');
    }

    try {
        const response = await fetch(`${url}hem?income=${income}&dependents=${dependents}`, {
            headers: {
                "Authorization": "Bearer " + process.env.BEARER_TOKEN
            }
        });

            // console.log("HEM Response status:", response.status + " " + response.statusText);

        // check http response status
        if (!response.ok) {
            throw new Error(`Response status: ${response.status + " " + response.statusText}`);
        }

        const result = await response.json();
            // console.log("HEM API response:", result);

        return result.hem;

    } catch (error) {
        console.error(error.name);
        console.error(error.message);
    }
}

/**
 * Calculates the total borrowing power amount and the monthly repayment configuration
 */
async function calculateBorrowingPower(income, dependents, expenses, creditLimits, annualAssessmentRate) {
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
    const maxLoanAmount = maxMonthlyRepayment * ((1 - Math.pow(1 + monthlyRate, - LOAN_TERM_MONTHS)) / monthlyRate);

    return {
        maxLoanAmount: Number(maxLoanAmount.toFixed(2)),
        monthlyRepayment: Number(maxMonthlyRepayment.toFixed(2))
    };
}

async function runConsoleMode() {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log("Mortgage Borrowing Power Calculator");
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
                    console.log(`Assumed Monthly Mortgage Repayment: $${result.monthlyRepayment.toLocaleString()} over 30 years`);
                    
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