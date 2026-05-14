import { APIRequestContext } from '@playwright/test';
import { Logger } from './logger';
import { ENV } from '../config/env';

export interface Account {
  id: number;
  customerId: number;
  type: string;
  balance: number;
}

/**
 * ApiHelper — wraps Playwright APIRequestContext with:
 * - Structured request/response logging
 * - Performance threshold assertion (default 2 s)
 * - Schema validation
 * - Concurrent throughput helper
 */
export class ApiHelper {
  private readonly baseUrl = ENV.apiBase;
  private readonly perfThreshold = ENV.apiPerfThresholdMs;

  constructor(private request: APIRequestContext) {}

  /** GET /customers/{customerId}/accounts */
  async getAccounts(customerId: string): Promise<Account[]> {
    const url = `${this.baseUrl}/customers/${customerId}/accounts`;
    Logger.apiRequest('GET', url);

    const start = Date.now();
    const response = await this.request.get(url, {
      headers: { Accept: 'application/json' },
    });
    const duration = Date.now() - start;

    const body = await response.json();
    Logger.apiResponse(response.status(), url, body, duration);

    if (duration > this.perfThreshold) {
      throw new Error(
        `[PERF] Response time ${duration}ms exceeded threshold of ${this.perfThreshold}ms`
      );
    }

    if (!response.ok()) {
      throw new Error(`GET accounts failed [${response.status()}]: ${JSON.stringify(body)}`);
    }

    return body as Account[];
  }

  /** GET /accounts/{accountId} */
  async getAccountById(accountId: string): Promise<Account> {
    const url = `${this.baseUrl}/accounts/${accountId}`;
    Logger.apiRequest('GET', url);

    const start = Date.now();
    const response = await this.request.get(url, {
      headers: { Accept: 'application/json' },
    });
    const duration = Date.now() - start;

    const body = await response.json();
    Logger.apiResponse(response.status(), url, body, duration);

    if (!response.ok()) {
      throw new Error(`GET account/${accountId} failed [${response.status()}]`);
    }

    return body as Account;
  }

  /**
   * Fire N concurrent GET accounts requests and wait for all to settle.
   * C-02 fix: use Promise.allSettled so individual failures are collected
   * and re-thrown as a single summarised error instead of being swallowed.
   */
  async getAccountsConcurrent(customerId: string, times = 20): Promise<void> {
    Logger.info(`Starting ${times} concurrent GET /accounts requests`);

    const results = await Promise.allSettled(
      Array.from({ length: times }, (_, i) =>
        this.getAccounts(customerId).then(() => {
          Logger.info(`Concurrent[${i + 1}/${times}] ✓`);
        })
      )
    );

    const failures = results
      .map((r, i) => ({ index: i + 1, result: r }))
      .filter((r): r is { index: number; result: PromiseRejectedResult } =>
        r.result.status === 'rejected'
      );

    failures.forEach(({ index, result }) =>
      Logger.error(`Concurrent[${index}/${times}] ✗ ${result.reason?.message ?? result.reason}`)
    );

    if (failures.length > 0) {
      throw new Error(
        `${failures.length}/${times} concurrent requests failed. ` +
        `First error: ${failures[0].result.reason?.message ?? failures[0].result.reason}`
      );
    }

    Logger.info('Concurrent throughput test complete — all requests succeeded');
  }

  /**
   * Schema + type guard validation for a single Account object.
   * Throws descriptive errors on schema violations.
   */
  validateAccountSchema(account: Account): void {
    const required: (keyof Account)[] = ['id', 'customerId', 'type', 'balance'];

    for (const field of required) {
      if (account[field] === undefined || account[field] === null) {
        throw new Error(`[SCHEMA] Missing required field: "${field}"`);
      }
    }

    if (typeof account.id !== 'number')       throw new Error(`[SCHEMA] "id" must be number, got ${typeof account.id}`);
    if (typeof account.customerId !== 'number') throw new Error(`[SCHEMA] "customerId" must be number`);
    if (typeof account.balance !== 'number')   throw new Error(`[SCHEMA] "balance" must be number, got ${typeof account.balance}`);
    if (!['CHECKING', 'SAVINGS'].includes(account.type)) {
      throw new Error(`[SCHEMA] "type" must be CHECKING|SAVINGS, got "${account.type}"`);
    }

    Logger.info(`Schema validation passed for account ${account.id}`);
  }
}
