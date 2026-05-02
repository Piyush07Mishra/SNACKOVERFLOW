import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  userId?: string;
  ip?: string;
  endpoint?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = join(process.cwd(), 'logs');
    this.logFile = join(this.logDir, 'app.log');
    
    // Create logs directory if it doesn't exist
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry): void {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      writeFileSync(this.logFile, logLine, { flag: 'a' });
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  error(message: string, userId?: string, ip?: string, endpoint?: string, error?: Error, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      userId,
      ip,
      endpoint,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    };

    this.writeLog(entry);
    
    // Also log to console for development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, { userId, ip, endpoint, error, metadata });
    }
  }

  warn(message: string, userId?: string, ip?: string, endpoint?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      userId,
      ip,
      endpoint,
      metadata
    };

    this.writeLog(entry);
    
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, { userId, ip, endpoint, metadata });
    }
  }

  info(message: string, userId?: string, ip?: string, endpoint?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      userId,
      ip,
      endpoint,
      metadata
    };

    this.writeLog(entry);
    
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[INFO] ${message}`, { userId, ip, endpoint, metadata });
    }
  }

  debug(message: string, userId?: string, ip?: string, endpoint?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      userId,
      ip,
      endpoint,
      metadata
    };

    this.writeLog(entry);
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, { userId, ip, endpoint, metadata });
    }
  }

  // Security-specific logging
  security(event: string, userId?: string, ip?: string, endpoint?: string, metadata?: Record<string, any>): void {
    this.warn(`SECURITY: ${event}`, userId, ip, endpoint, {
      ...metadata,
      securityEvent: event
    });
  }

  // API request logging
  apiRequest(method: string, endpoint: string, userId?: string, ip?: string, statusCode?: number, responseTime?: number): void {
    this.info(`API Request: ${method} ${endpoint}`, userId, ip, endpoint, {
      method,
      statusCode,
      responseTime
    });
  }

  // Database operation logging
  db(operation: string, collection: string, userId?: string, query?: any, result?: any): void {
    this.debug(`DB Operation: ${operation} on ${collection}`, userId, undefined, undefined, {
      operation,
      collection,
      query: JSON.stringify(query),
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
    });
  }
}

export const logger = new Logger();
export default logger;
