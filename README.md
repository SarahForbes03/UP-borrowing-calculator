# Borrowing Power Calculator
A borrowing power calculator that estimates a user's maximum loan amount and affordable monthly repayment based on their income, dependents, living expenses and credit card limits.

The calculator retrieves **tax** and **Household Expenditure Measure (HEM)** values from an API and uses these values when calculating borrowing capacity.
## Table of Contents
* [How the Calculation Works](#how-the-calculation-works)
  * [1. Calculate Annual Tax](#1-calculate-annual-tax)
  * [2. Calculate Net Monthly Income](#2-calculate-net-monthly-income)
  * [3. Determine Living Expenses](#3-determine-living-expenses)
  * [4. Calculate Credit Card Liability](#4-calculate-credit-card-liability)
  * [5. Calculate Maximum Monthly Repayment](#5-calculate-maximum-monthly-repayment)
  * [6. Calculate Maximum Borrowing Power](#6-calculate-maximum-borrowing-power)
* [Loan Configuration](#loan-configuration)
* [Requirements](#requirements)
* [Installation](#installation)
* [Running the Calculator](#running-the-calculator)
* [Project Structure](#project-structure)
  * [borrowingCalculator.js](#borrowingcalculatorjs)
  * [server.js](#serverjs)
  * [package.json](#packagejson)
  * [.env](#env)
* [API Functions](#api-functions)
  * [Tax API](#tax-api)
    * [Success response (200 OK)](#success-response-200-ok)
  * [HEM API](#hem-api)
    * [Success response (200 OK)](#success-response-200-ok-1)
* [Input Validation](#input-validation)
  * [Income](#income)
  * [Dependents](#dependents)
  * [Monthly Expenses](#monthly-expenses)
  * [Credit Card Limits](#credit-card-limits)
* [Error Handling](#error-handling)
* [Testing](#testing)
* [Resources Used](#resources-used)
* [Notes](#notes)

## How the Calculation Works
### 1. Calculate Annual Tax
The calculator sends the user's gross annual income to the Tax API and retrieves their annual tax amount.

### 2. Calculate Net Monthly Income
The annual tax is deducted from the gross annual income and then divided by 12:
```
Net Monthly Income = (Gross Annual Income - Annual Tax) / 12
```
### 3. Determine Living Expenses
The calculator retrieves the user's Household Expenditure Measure (HEM) value from the API.

The higher value between the user's declared monthly expenses and HEM is used:
```
Living Expenses = max(Declared Expenses, HEM)
```
### 4. Calculate Credit Card Liability
Credit card liability is estimated as 3% of the user's total credit card limits:
```
Credit Card Liability = Credit Card Limits × 0.03
```
### 5. Calculate Maximum Monthly Repayment
The maximum monthly repayment is calculated by subtracting living expenses and credit card liabilities from net monthly income:
```
Maximum Monthly Repayment =
Net Monthly Income
    - Living Expenses
    - Credit Card Liability
```
If the resulting repayment capacity is zero or negative, the calculator returns a maximum loan amount and monthly repayment of $0.

### 6. Calculate Maximum Borrowing Power
The maximum loan amount is calculated using the present value of an annuity formula:
```
P = M × (1 - (1 + R)^-N) / R
```
Where:
- `P` = Maximum loan amount
- `M` = Maximum monthly repayment
- `R` = Monthly assessment interest rate
- `N` = Number of monthly repayments

## Loan Configuration
The current calculator uses:

| Setting                  |        Value        |
|--------------------------|:-------------------:|
| Base interest rate       |        7.0%         |
| Assessment rate buffer   |        3.0%         |
| Assessment interest rate |        10.0%        |
| Loan term                |       5 years       |
| Loan term in months      |      60 months      |
| Credit card liability    | 3% of total limits  |

The assessment rate is calculated as:
```
Assessment Rate = Base Interest Rate + Assessment Rate Buffer
```
Therefore:
```
7.0% + 3.0% = 10.0%
```

## Requirements
You will need:
- Node.js
- npm
- Access to the supplied Tax and HEM API
- A valid API bearer token

## Installation
Install the project dependencies:
```
npm install
```
Create a `.env` file in the project root.

Example:
```
API_URL=http://localhost:3000/api/
BEARER_TOKEN=your_token_here
```
Do not commit your `.env` file or expose your bearer token.

It is recommended to add `.env` to `.gitignore`:

## Running the Calculator
You will need to run the development API in its own terminal window. (The server will be available at http://localhost:3000/). To start the server run the following command:
```
npm run api
```
Note: You can stop the server with Ctrl+C

Then run:

```
npm start
```

The calculator will prompt you for:
```
Gross Annual Income: $
Number of Dependents:
Declared Monthly Expenses: $
Total Credit Card Limits: $
```
It will then display the estimated borrowing power and monthly repayment.

Example:
```
Loan Borrowing Power Calculator
===================================
Gross Annual Income: $50000
Number of Dependents: 2
Declared Monthly Expenses: $3000
Total Credit Card Limits: $10000

--- Calculation Summary ---
Maximum Borrowing Power at 7%: $XX,XXX
Assumed Monthly Loan Repayment: $X,XXX over 5 years
```

## Project Structure
```
.
├── borrowingCalculator.js
├── server.js
├── package.json
├── package-lock.json
├── .env
└── README.md
```
### borrowingCalculator.js
Contains the main borrowing power calculation and API functions:
- `getTax()`
- `getHEM()`
- `calculateBorrowingPower()`
- `runConsoleMode()`

### server.js
Provides the Tax and HEM API endpoints used by the calculator.

### package.json
Contains the project's Node.js dependencies and scripts.

### .env
Contains environment variables required to connect to the API.

The `.env` file should not be committed to source control.

## API Functions
### Tax API
The calculator sends a request containing the user's income:
```
GET /tax?income={income}
```
The API response is expected to contain a `tax` value.

#### Success response (200 OK)
```json
{
  "income": 125000,
  "tax": 25750
}
```
### HEM API
The calculator sends the user's income and number of dependents:
```
GET /hem?income={income}&dependents={dependents}
```
The API response is expected to contain a `hem` value.

#### Success response (200 OK)
```json
{
  "income": 125000,
  "dependents": 2,
  "hem": 3100
}
```
Both requests require a bearer token.

## Input Validation
The calculator validates user input before performing calculations.

### Income
- Must be a valid number
- Must be greater than zero
- Cannot exceed $1,000,000,000

### Dependents
- Must be a valid number
- Cannot be negative
- Cannot be greater than 3

### Monthly Expenses
- Must be a valid number
- Cannot be negative

### Credit Card Limits
- Must be a valid number
- Cannot be negative

Invalid inputs result in an error rather than continuing with the calculation.

## Error Handling
The calculator checks the HTTP response from both APIs.

If an API request fails, the error is logged and passed back to the calling function.

This allows API failures to be handled by the application or test suite rather than silently returning an incorrect value.

## Testing
The calculator functions are exported from `borrowingCalculator.js`, allowing them to be tested using a testing framework such as Mocha.

Run the tests with:
```
npm test
```
Tests should cover:

- Normal borrowing power calculations
- Different income levels
- Different numbers of dependents
- Declared expenses below HEM
- Declared expenses above HEM
- Users with no borrowing capacity
- Invalid income
- Zero income
- Income above the maximum allowed value
- Invalid dependents
- Negative dependents
- More than 3 dependents
- Negative expenses
- Invalid expenses
- Negative credit card limits
- Invalid credit card limits
- API errors
- Tax API responses
- HEM API responses

## Resources Used:
https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#examples

https://reqbin.com/code/javascript/ricgaie0/javascript-fetch-bearer-token

https://reqbin.com/code/javascript/rftjizcl/javascript-get-request-example

https://stackoverflow.com/questions/45535913/setting-authorization-header-in-fetch-api

https://stackoverflow.com/questions/71685024/calling-api-with-javascript-html

https://mochajs.org/features/asynchronous-code/

https://www.npmjs.com/package/dotenv

https://www.dotenv.org/docs/quickstart.html

https://www.w3schools.com/nodejs/nodejs_assert.asp

https://www.w3schools.com/js/js_api_fetch.asp

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling#exception_handling_statements

https://developer.mozilla.org/en-US/docs/Web/API/Response

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals

https://developer.mozilla.org/en-US/docs/Web/API/Request/json

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes


## Notes:
- Loan term has been updated from 360 months to 60 months (5 years) in an attempt to replicate Bendigo's loan calculator
- Lexicon used has been updated from context of a mortgage to a loan to match assessment requirements
- Functions have been turned into a class in a separate file [(calculatorClass.js)](calculatorClass.js) but is non-functional currently

˗ˏˋ ♡ ˎˊ˗

Thank you, Ferocia Team, for viewing my project! (˶ᵔ ᵕ ᵔ˶)
