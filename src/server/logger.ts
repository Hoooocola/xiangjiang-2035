type LogContext = Record<string, string | number | boolean | null | undefined>;

export function logServerEvent(event: string, context: LogContext = {}) {
  console.info(
    JSON.stringify({
      level: "info",
      event,
      at: new Date().toISOString(),
      ...context,
    }),
  );
}

export function logServerError(event: string, error: unknown, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      at: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      ...context,
    }),
  );
}
