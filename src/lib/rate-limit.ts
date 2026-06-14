interface RateLimitBucket {
  timestamps: number[];
}

const globalForRateLimit = globalThis as unknown as {
  buckets: Map<string, RateLimitBucket> | undefined;
};

const buckets = globalForRateLimit.buckets ?? new Map<string, RateLimitBucket>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.buckets = buckets;
}

export async function rateLimit(ip: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(ip, bucket);
  }

  // Clear out stale records past the sliding window threshold
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= limit) {
    return false; // Exceeded budget
  }

  bucket.timestamps.push(now);
  return true;
}
