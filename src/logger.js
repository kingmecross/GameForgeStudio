// Lightweight structured logger for a single generate() run. Collects
// timestamped events in memory (persisted as generation.log by the
// orchestrator) and optionally forwards each one to `onEvent` for live
// output — cli.js passes a console printer; tests leave it unset so
// `node --test` output stays clean.

export function createRunLogger({ onEvent } = {}) {
  const events = [];
  const startedAt = Date.now();

  function record(level, message, meta) {
    const entry = {
      ts: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      level,
      message,
      ...(meta !== undefined ? { meta } : {}),
    };
    events.push(entry);
    if (onEvent) onEvent(entry);
    return entry;
  }

  return {
    info: (message, meta) => record('info', message, meta),
    warn: (message, meta) => record('warn', message, meta),
    error: (message, meta) => record('error', message, meta),
    events: () => events.slice(),
    toText: () =>
      events
        .map((e) => `${e.ts} [${e.level.toUpperCase()}] (+${e.elapsedMs}ms) ${e.message}${e.meta !== undefined ? ' ' + JSON.stringify(e.meta) : ''}`)
        .join('\n') + (events.length ? '\n' : ''),
  };
}
