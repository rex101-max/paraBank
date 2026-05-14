/**
 * testDataGenerator.ts
 * Random test data utilities — used across UI and API tests.
 * Inspired by AI-assisted data generation patterns (GitHub Copilot style).
 */

const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Henry'];
const LAST_NAMES  = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
const STREETS     = ['Oak Lane', 'Maple Ave', 'Cedar Blvd', 'Pine St', 'Elm Dr'];
const CITIES      = ['Springfield', 'Shelbyville', 'Ogdenville', 'North Haverbrook'];
const STATES      = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'IL'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateUser() {
  const first = pick(FIRST_NAMES);
  const last  = pick(LAST_NAMES);
  return {
    firstName:   first,
    lastName:    last,
    address:     `${randInt(100, 9999)} ${pick(STREETS)}`,
    city:        pick(CITIES),
    state:       pick(STATES),
    zipCode:     String(randInt(10000, 99999)),
    phone:       `555-${randInt(1000, 9999)}`,
    ssn:         `${randInt(100, 999)}-${randInt(10, 99)}-${randInt(1000, 9999)}`,
    username:    `${first.toLowerCase()}${last.toLowerCase()}${randInt(10, 999)}`,
    password:    `Pass@${randInt(1000, 9999)}`,
  };
}

export function generateTransferAmount(min = 10, max = 500): string {
  return String(randInt(min, max));
}

export function generateAccountType(): 'CHECKING' | 'SAVINGS' {
  return Math.random() > 0.5 ? 'CHECKING' : 'SAVINGS';
}

/** Parse a currency string like "$1,200.50" → 1200.50 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[$,]/g, ''));
}
