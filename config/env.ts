/**
 * config/env.ts
 * Central environment configuration.
 * Override values by setting environment variables before running tests.
 *
 * Example:
 *   PARABANK_USER=myuser PARABANK_PASS=mypass npx playwright test
 */
export const ENV = {
  baseUrl:    process.env.PARABANK_BASE_URL ?? 'https://parabank.parasoft.com',
  apiBase:    process.env.PARABANK_API_BASE  ?? 'https://parabank.parasoft.com/parabank/services/bank',
  username:   process.env.PARABANK_USER      ?? 'john',
  password:   process.env.PARABANK_PASS      ?? 'demo',
  customerId: process.env.PARABANK_CID       ?? '12212',

  /** Max allowed API response time in milliseconds */
  apiPerfThresholdMs: Number(process.env.API_PERF_THRESHOLD_MS ?? 2000),

  /** How many concurrent requests to fire in the throughput test */
  concurrentRequestCount: Number(process.env.CONCURRENT_REQ_COUNT ?? 20),
} as const;
