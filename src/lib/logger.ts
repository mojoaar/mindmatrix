type LogMeta = Record<string, unknown>;

function format(level: string, msg: string, meta?: LogMeta) {
  return JSON.stringify({ level, msg, ts: new Date().toISOString(), ...meta });
}

export const logger = {
  error(msg: string, meta?: LogMeta) {
    console.error(format("error", msg, meta));
  },
  warn(msg: string, meta?: LogMeta) {
    console.warn(format("warn", msg, meta));
  },
  info(msg: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === "development") {
      console.log(format("info", msg, meta));
    }
  },
};
