import { File, Paths } from 'expo-file-system';

const LOG_FILE = 'startup_crash.json';

function writeSync(data: Record<string, unknown>): void {
  try {
    const dir = Paths.cache;
    const file = new File(dir, LOG_FILE);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(data));
  } catch {
    // best effort
  }
}

const ErrorUtils = (globalThis as any).ErrorUtils as
  | { getGlobalHandler: () => Function; setGlobalHandler: (h: Function) => void }
  | undefined;

if (ErrorUtils) {
  const prev = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    writeSync({
      type: isFatal ? 'FATAL' : 'UNCAUGHT',
      message: error.message,
      stack: error.stack,
      time: Date.now(),
    });
    prev(error, isFatal);
  });
}

if (typeof globalThis.onunhandledrejection !== 'undefined') {
  const prev = globalThis.onunhandledrejection;
  globalThis.onunhandledrejection = (event: PromiseRejectionEvent) => {
    writeSync({
      type: 'UNHANDLED_REJECTION',
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
      time: Date.now(),
    });
    if (prev) prev(event);
  };
}

writeSync({ type: 'STARTUP', message: 'App started', time: Date.now() });
