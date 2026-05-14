# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance\performanceLite.spec.ts >> Performance Engineering @api >> PERF-01 | API response time stays below threshold @api
- Location: tests\performance\performanceLite.spec.ts:18:7

# Error details

```
Error: apiRequestContext.get: unable to get local issuer certificate
Call log:
  - → GET https://parabank.parasoft.com/parabank/services/bank/customers/12212/accounts
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Safari/537.36
    - accept: application/json
    - accept-encoding: gzip,deflate,br

```

# Test source

```ts
  1   | import { APIRequestContext } from '@playwright/test';
  2   | import { Logger } from './logger';
  3   | import { ENV } from '../config/env';
  4   | 
  5   | export interface Account {
  6   |   id: number;
  7   |   customerId: number;
  8   |   type: string;
  9   |   balance: number;
  10  | }
  11  | 
  12  | /**
  13  |  * ApiHelper — wraps Playwright APIRequestContext with:
  14  |  * - Structured request/response logging
  15  |  * - Performance threshold assertion (default 2 s)
  16  |  * - Schema validation
  17  |  * - Concurrent throughput helper
  18  |  */
  19  | export class ApiHelper {
  20  |   private readonly baseUrl = ENV.apiBase;
  21  |   private readonly perfThreshold = ENV.apiPerfThresholdMs;
  22  | 
  23  |   constructor(private request: APIRequestContext) {}
  24  | 
  25  |   /** GET /customers/{customerId}/accounts */
  26  |   async getAccounts(customerId: string): Promise<Account[]> {
  27  |     const url = `${this.baseUrl}/customers/${customerId}/accounts`;
  28  |     Logger.apiRequest('GET', url);
  29  | 
  30  |     const start = Date.now();
> 31  |     const response = await this.request.get(url, {
      |                                         ^ Error: apiRequestContext.get: unable to get local issuer certificate
  32  |       headers: { Accept: 'application/json' },
  33  |     });
  34  |     const duration = Date.now() - start;
  35  | 
  36  |     const body = await response.json();
  37  |     Logger.apiResponse(response.status(), url, body, duration);
  38  | 
  39  |     if (duration > this.perfThreshold) {
  40  |       throw new Error(
  41  |         `[PERF] Response time ${duration}ms exceeded threshold of ${this.perfThreshold}ms`
  42  |       );
  43  |     }
  44  | 
  45  |     if (!response.ok()) {
  46  |       throw new Error(`GET accounts failed [${response.status()}]: ${JSON.stringify(body)}`);
  47  |     }
  48  | 
  49  |     return body as Account[];
  50  |   }
  51  | 
  52  |   /** GET /accounts/{accountId} */
  53  |   async getAccountById(accountId: string): Promise<Account> {
  54  |     const url = `${this.baseUrl}/accounts/${accountId}`;
  55  |     Logger.apiRequest('GET', url);
  56  | 
  57  |     const start = Date.now();
  58  |     const response = await this.request.get(url, {
  59  |       headers: { Accept: 'application/json' },
  60  |     });
  61  |     const duration = Date.now() - start;
  62  | 
  63  |     const body = await response.json();
  64  |     Logger.apiResponse(response.status(), url, body, duration);
  65  | 
  66  |     if (!response.ok()) {
  67  |       throw new Error(`GET account/${accountId} failed [${response.status()}]`);
  68  |     }
  69  | 
  70  |     return body as Account;
  71  |   }
  72  | 
  73  |   /**
  74  |    * Fire N concurrent GET accounts requests and wait for all to settle.
  75  |    * C-02 fix: use Promise.allSettled so individual failures are collected
  76  |    * and re-thrown as a single summarised error instead of being swallowed.
  77  |    */
  78  |   async getAccountsConcurrent(customerId: string, times = 20): Promise<void> {
  79  |     Logger.info(`Starting ${times} concurrent GET /accounts requests`);
  80  | 
  81  |     const results = await Promise.allSettled(
  82  |       Array.from({ length: times }, (_, i) =>
  83  |         this.getAccounts(customerId).then(() => {
  84  |           Logger.info(`Concurrent[${i + 1}/${times}] ✓`);
  85  |         })
  86  |       )
  87  |     );
  88  | 
  89  |     const failures = results
  90  |       .map((r, i) => ({ index: i + 1, result: r }))
  91  |       .filter((r): r is { index: number; result: PromiseRejectedResult } =>
  92  |         r.result.status === 'rejected'
  93  |       );
  94  | 
  95  |     failures.forEach(({ index, result }) =>
  96  |       Logger.error(`Concurrent[${index}/${times}] ✗ ${result.reason?.message ?? result.reason}`)
  97  |     );
  98  | 
  99  |     if (failures.length > 0) {
  100 |       throw new Error(
  101 |         `${failures.length}/${times} concurrent requests failed. ` +
  102 |         `First error: ${failures[0].result.reason?.message ?? failures[0].result.reason}`
  103 |       );
  104 |     }
  105 | 
  106 |     Logger.info('Concurrent throughput test complete — all requests succeeded');
  107 |   }
  108 | 
  109 |   /**
  110 |    * Schema + type guard validation for a single Account object.
  111 |    * Throws descriptive errors on schema violations.
  112 |    */
  113 |   validateAccountSchema(account: Account): void {
  114 |     const required: (keyof Account)[] = ['id', 'customerId', 'type', 'balance'];
  115 | 
  116 |     for (const field of required) {
  117 |       if (account[field] === undefined || account[field] === null) {
  118 |         throw new Error(`[SCHEMA] Missing required field: "${field}"`);
  119 |       }
  120 |     }
  121 | 
  122 |     if (typeof account.id !== 'number')       throw new Error(`[SCHEMA] "id" must be number, got ${typeof account.id}`);
  123 |     if (typeof account.customerId !== 'number') throw new Error(`[SCHEMA] "customerId" must be number`);
  124 |     if (typeof account.balance !== 'number')   throw new Error(`[SCHEMA] "balance" must be number, got ${typeof account.balance}`);
  125 |     if (!['CHECKING', 'SAVINGS'].includes(account.type)) {
  126 |       throw new Error(`[SCHEMA] "type" must be CHECKING|SAVINGS, got "${account.type}"`);
  127 |     }
  128 | 
  129 |     Logger.info(`Schema validation passed for account ${account.id}`);
  130 |   }
  131 | }
```