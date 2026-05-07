import * as Sentry from "@sentry/node";
import newrelic from "newrelic";

/**
 * Initialize Sentry for error tracking
 */
export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || "production",
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACE_SAMPLE_RATE || "0.1"),
    replaysSessionSampleRate: parseFloat(
      process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "0.1"
    ),
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });
};

/**
 * Initialize New Relic for monitoring
 */
export const initNewRelic = () => {
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    newrelic.setTransactionName("CBT API");
  }
};

/**
 * Custom logging
 */
export class Logger {
  static info(message: string, metadata?: any) {
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        message,
        ...metadata,
      })
    );
  }

  static error(message: string, error?: Error, metadata?: any) {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        message,
        error: error?.message,
        stack: error?.stack,
        ...metadata,
      })
    );

    Sentry.captureException(error, { contexts: { metadata } });
  }

  static warn(message: string, metadata?: any) {
    console.warn(
      JSON.stringify({
        level: "WARN",
        timestamp: new Date().toISOString(),
        message,
        ...metadata,
      })
    );
  }

  static debug(message: string, metadata?: any) {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(
        JSON.stringify({
          level: "DEBUG",
          timestamp: new Date().toISOString(),
          message,
          ...metadata,
        })
      );
    }
  }
}