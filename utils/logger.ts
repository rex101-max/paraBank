import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.resolve('logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logStream = fs.createWriteStream(path.join(LOG_DIR, 'run.log'), { flags: 'a' });

type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  const line = JSON.stringify(entry);
  logStream.write(line + '\n');

  // Also print to console with color
  const colors: Record<Level, string> = {
    INFO:  '\x1b[36m',
    WARN:  '\x1b[33m',
    ERROR: '\x1b[31m',
    DEBUG: '\x1b[90m',
  };
  console.log(`${colors[level]}[${level}]\x1b[0m ${message}`);
}

/**
 * Central logger — writes structured JSON to logs/run.log
 * and colorized output to the console.
 */
export const Logger = {
  info:  (msg: string, meta?: Record<string, unknown>) => write('INFO',  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => write('WARN',  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('ERROR', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => write('DEBUG', msg, meta),

  /** Log full API request details */
  apiRequest(method: string, url: string, body?: unknown) {
    write('INFO', `API REQUEST: ${method} ${url}`, body ? { body } : undefined);
  },

  /** Log full API response details */
  apiResponse(status: number, url: string, body: unknown, durationMs: number) {
    write('INFO', `API RESPONSE: ${status} ${url} (${durationMs}ms)`, { body });
  },
};
