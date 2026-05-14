# ParaBank — Automated Independent Validation System
### Playwright + TypeScript | QA Capstone Project

> **Application Under Test:** [https://parabank.parasoft.com](https://parabank.parasoft.com)  
> **API Swagger:** [https://parabank.parasoft.com/parabank/api-docs/index.html](https://parabank.parasoft.com/parabank/api-docs/index.html)  
> **Framework:** Playwright + TypeScript | POM + Fixtures + Parallel Execution

---

## Project Overview

This capstone project implements an end-to-end Automated Independent Validation System for the ParaBank demo banking application. It validates account creation, fund transfer, and balance consistency across UI and API layers using a scalable, modular Playwright framework.

### What is validated
| Layer | Coverage |
|-------|---------|
| UI    | Account creation (Savings + Checking), Fund transfer, Login, Negative scenarios |
| API   | GET accounts, Schema validation, Response time (< 2s), 20x concurrent load |
| Hybrid | Create via UI → validate in API, Transfer via UI → validate balances via API |

---

## Folder Structure

```
parabank-capstone/
├── playwright.config.ts        # Multi-browser, parallel, retry, reporters
├── package.json                # Dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
│
├── config/
│   └── env.ts                  # Central environment config (URL, credentials)
│
├── pages/                      # Page Object Model classes
│   ├── LoginPage.ts
│   ├── OpenAccountPage.ts
│   ├── TransferFundsPage.ts
│   └── AccountsOverviewPage.ts
│
├── fixtures/
│   └── parabank.fixtures.ts    # Shared Playwright test fixtures
│
├── utils/
│   ├── logger.ts               # Central JSON logger (file + console)
│   ├── apiHelper.ts            # API wrapper with perf threshold + schema validation
│   ├── testDataGenerator.ts    # Random test data generation
│   ├── smartLocator.ts         # MCP-inspired self-healing selector strategy
│   └── failureAnalysis.ts      # AI-assisted HTML failure analysis report
│
├── tests/
│   ├── ui/
│   │   ├── accountCreation.spec.ts   # FR-01, FR-08, FR-09
│   │   └── fundTransfer.spec.ts      # FR-05, FR-08
│   ├── api/
│   │   └── accounts.spec.ts          # FR-02, FR-03, FR-04, FR-06
│   ├── e2e/
│   │   └── hybridFlow.spec.ts        # FR-01+FR-03, FR-05+FR-06+FR-07
│   └── performance/
│       └── performanceLite.spec.ts   # API perf + UI load timing
│
├── test-data/
│   └── parabank.json           # Data-driven test inputs
│
└── .github/
    └── workflows/
        └── playwright.yml      # GitHub Actions CI/CD pipeline
```

---

## Prerequisites

| Tool    | Version      |
|---------|-------------|
| Node.js | >= 18.0.0   |
| npm     | >= 9.0.0    |
| Git     | any         |

---

## Setup & Installation

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Install Playwright browsers
```bash
npx playwright install --with-deps
```
> This installs Chromium, Firefox, and any OS-level browser dependencies.  
> On Linux CI you may need `sudo npx playwright install-deps` instead.

### Step 3 — (Optional) Configure environment
By default the project runs against the live ParaBank demo with the built-in `john/demo` account.  
To override, set environment variables before running:

```bash
export PARABANK_USER=john
export PARABANK_PASS=demo
export PARABANK_CID=12212
export PARABANK_BASE_URL=https://parabank.parasoft.com
export API_PERF_THRESHOLD_MS=2000
```

---

## Running Tests

### Run the full test suite
```bash
npm test
```

### Run by tag
```bash
npm run test:smoke         # Quick smoke pass — core happy paths
npm run test:regression    # Full regression suite
npm run test:api           # API-only tests
npm run test:e2e           # Hybrid UI + API end-to-end flows
```

### Run by layer
```bash
npm run test:ui            # UI tests only (Chrome + Firefox)
npm run test:perf          # Performance lite suite
```

### Run on a single browser
```bash
npm run test:chrome
npm run test:firefox
```

### Run in headed mode (watch the browser)
```bash
npm run test:headed
```

### Debug a single test interactively
```bash
npm run test:debug
```

---

## Reports

### Playwright HTML Report
```bash
npm run report
# Opens at http://localhost:9323 — includes screenshots, videos, traces
```

### Allure Report
```bash
# Generate the report from raw results
npm run report:allure:gen

# Open a live Allure server
npm run report:allure
```

### AI Failure Analysis Report
```bash
npm run report:failures
# Reads reports/test-results.json
# Outputs reports/failure-analysis.html
# Shows: failure count, error message patterns, historical grouping
```

---

## Framework Architecture

### Page Object Model (POM)
Every page has its own class in `/pages`. Selectors are defined as private locators. Public methods represent user actions. No `waitForTimeout` is used anywhere — Playwright auto-waiting handles timing.

```typescript
// Usage in a test
const { loginPage, openAccountPage } = fixtures;
await loginPage.navigate();
await loginPage.login('john', 'demo');
await openAccountPage.openAccount('SAVINGS');
```

### Fixtures (`fixtures/parabank.fixtures.ts`)
All page objects and the API helper are injected via Playwright's fixture system. Tests import `test` from fixtures instead of `@playwright/test`:

```typescript
import { test, expect } from '../../fixtures/parabank.fixtures';

test('my test', async ({ loginPage, apiHelper, authenticatedPage }) => { ... });
```

### Logger (`utils/logger.ts`)
Writes structured JSON to `logs/run.log` and coloured output to the console. All API requests and responses are automatically captured.

```typescript
Logger.info('Account created', { accountId: '12345' });
Logger.apiRequest('GET', url);
Logger.apiResponse(200, url, body, 143);
```

### Smart Locator — MCP Self-Healing (`utils/smartLocator.ts`)
Implements a fallback selector chain inspired by Model Context Protocol adaptive locator concepts. If the primary selector fails, the next in the list is tried automatically — with a warning logged.

```typescript
const smart = new SmartLocator(page);
const btn = await smart.loginButton();
// Tries: [value="Log In"] → button:has-text("Log In") → input[type="submit"]
```

### AI Failure Analysis (`utils/failureAnalysis.ts`)
After a test run, parses `reports/test-results.json` and outputs an HTML report grouping failures by error message pattern — useful for identifying flaky tests and systemic issues.

---

## CI/CD — GitHub Actions

The pipeline at `.github/workflows/playwright.yml`:
1. Triggers on push to `main`/`develop` and nightly at 02:00 UTC
2. Installs Node + Playwright browsers
3. Runs smoke tests first (fast feedback)
4. Runs full suite with all reporters
5. Generates Allure HTML report
6. Uploads artifacts: HTML report, Allure report, screenshots, videos, traces

Set these secrets in your GitHub repository:
```
PARABANK_USER
PARABANK_PASS
PARABANK_CID
```

---

## Functional Requirements Coverage

| Req ID | Requirement | Test Coverage |
|--------|------------|---------------|
| FR-01  | Create new account via UI | TC-AC-UI-01, TC-AC-UI-02, TC-E2E-01 |
| FR-02  | GET accounts list via API | TC-API-01, TC-PERF-01, TC-PERF-02 |
| FR-03  | Validate new account exists in API | TC-API-03, TC-E2E-01 |
| FR-04  | Validate account type and details | TC-API-02, TC-E2E-01 |
| FR-05  | Transfer funds via UI | TC-FT-UI-01, TC-E2E-02 |
| FR-06  | Validate updated balances via API | TC-E2E-02 |
| FR-07  | Validate before/after balances | TC-E2E-02 |
| FR-08  | Validate UI success messages | TC-AC-UI-01, TC-FT-UI-01 |
| FR-09  | Validate negative scenarios | TC-NEG-01, TC-NEG-02 |

---

## Test Tags Quick Reference

| Tag | What it runs |
|-----|-------------|
| `@smoke` | Core happy-path tests — fastest feedback |
| `@regression` | Full functional coverage |
| `@api` | API-only tests (no browser) |
| `@e2e` | Hybrid UI + API end-to-end flows |

---

## Troubleshooting

**`Error: browserType.launch: Executable doesn't exist`**  
→ Run `npx playwright install --with-deps`

**Tests fail with network/timeout errors**  
→ ParaBank is a shared demo environment. Retry with `npm run test:smoke` first. Retries are configured at `retries: 1` locally and `retries: 2` in CI.

**`Cannot find module '../config/env'`**  
→ Ensure `tsconfig.json` is present and run `npm install` to confirm `ts-node` is installed.

**Allure command not found**  
→ Install globally: `npm install -g allure-commandline`

---

## Best Practices Followed

- No hard waits (`waitForTimeout`) anywhere — Playwright auto-waiting used throughout
- Reusable page objects with single-responsibility methods
- All selectors use semantic attributes (`[name]`, `[value]`, `#id`) over fragile CSS chains
- API response time asserted in every API call via `ApiHelper`
- Schema validated for every API response in relevant tests
- Random test data generated per run to avoid cross-test contamination
- Structured JSON logging for every API request and response
- Self-healing smart locators for resilience against minor DOM changes
