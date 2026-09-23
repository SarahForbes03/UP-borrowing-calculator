class CalculatorClass {
    constructor(
        LOAN_TERM_MONTHS = 60,
        INTEREST_RATE = 7.0,
        ASSESSMENT_RATE_BUFFER = 3.0,
        TOKEN = process.env.BEARER_TOKEN,
        URL = process.env.API_URL
        ) {
        this._LOAN_TERM_MONTHS = LOAN_TERM_MONTHS;
        this._INTEREST_RATE = INTEREST_RATE;
        this._ANNUAL_ASSESSMENT_RATE = INTEREST_RATE + ASSESSMENT_RATE_BUFFER;
        this._TOKEN = TOKEN;
        this._URL = URL;
    }

    async calculate(income, dependents, expenses, creditLimits,){
        const maxMonthlyRepayment = await this.calculateMonthlyRepayment(income, dependents, expenses, creditLimits);
        const monthlyRepayment = Number(maxMonthlyRepayment.toFixed(2));

        const borrowingPower = this.calculateBorrowingPower(maxMonthlyRepayment);

        return {
            maxLoanAmount: borrowingPower,
            monthlyRepayment
        };
    }

    async getTax(income) {
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
            const response = await fetch(`${this._URL}tax?income=${income}`, {
                headers: {
                    "Authorization": "Bearer " + this._TOKEN
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
    async getHEM(income,dependents){
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
            const response = await fetch(`${this._URL}hem?income=${income}&dependents=${dependents}`, {
                headers: {
                    "Authorization": "Bearer " + this._TOKEN
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
            throw error;
        }
    }

    async calculateMonthlyRepayment(income, dependents, expenses, creditLimits){
        if (!Number.isFinite(income)) throw new TypeError("Income must be a valid number.");
        if (!Number.isFinite(dependents)) throw new TypeError("Dependents must be a valid number.");
        if (!Number.isFinite(expenses)) throw new TypeError("Monthly expenses must be a valid number.");
        if (expenses < 0){ throw new RangeError('Monthly expenses cannot be negative');}
        if (!Number.isFinite(creditLimits)) throw new TypeError("Credit Card Limits must be a valid number.");
        if (creditLimits < 0){ throw new RangeError('Credit Card Limits cannot be negative');}

        // 1. Calculate Net Monthly Income after tax deductions
        const annualTax = await this.getTax(income);
        const netMonthlyIncome = (income - annualTax) / 12;

        // 2. Determine living expenses (User declared expenses vs HEM baseline, whichever is higher)
        const baselineHEM = await this.getHEM(income, dependents);
        const totalLivingExpenses = Math.max(expenses, baselineHEM);

        // 3. Calculate credit card liability (~3% of total limits)
        const creditCardLiability = creditLimits * 0.03;

        // 4. Calculate monthly repayment capacity
        const maxMonthlyRepayment = netMonthlyIncome - totalLivingExpenses - creditCardLiability;

        // Return early if user cannot afford a loan at all
        if (maxMonthlyRepayment <= 0) {
            // return { maxLoanAmount: 0, monthlyRepayment: 0 };
            return 0;
        }

        // const monthlyRepayment = Number(maxMonthlyRepayment.toFixed(2))
        return maxMonthlyRepayment
    }

    calculateBorrowingPower(maxMonthlyRepayment){
        // 5. Calculate the monthly interest rate
        const monthlyRate = (this._ANNUAL_ASSESSMENT_RATE / 100) / 12;

        // 6. Calculate maximum borrowing power using the following formula:
        // P = M * (1 - (1 + R)^-N) / R
        const loanAmount = maxMonthlyRepayment * ((1 - Math.pow(1 + monthlyRate, - this._LOAN_TERM_MONTHS)) / monthlyRate);
        return Number(loanAmount.toFixed(2))
    }
}

module.exports = CalculatorClass;