import Redis from "ioredis";

// Local cache for non-blocking fallback checks when Redis is offline or slow
const localCache = new Map<string, number>();

// Clean up old fallback entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of localCache.entries()) {
    if (now - val > 15000) {
      localCache.delete(key);
    }
  }
}, 30000);

let isRedisHealthy = false;

// Hardcoded Cloud Redis credentials configured permanently
// Disabling offline queue and configuring a fast connection timeout to avoid hanging the API server
export const redis = new Redis({
  host: 'note-believe-rosegold-84519.db.redis.io',
  port: 14372,
  password: 'i73aF6P0isDnIWJTBq4X9Rw1oANUV9Ie',
  lazyConnect: true, // Non-blocking lazy connection
  maxRetriesPerRequest: 1, // Fail fast on requests if connection drops
  connectTimeout: 1500, // Timeout connection after 1.5 seconds
  enableOfflineQueue: false, // DO NOT queue commands when connection is down - fail fast
  retryStrategy(times) {
    // Limit retries to avoid endless connection attempts and log spam if Redis is permanently down in this environment
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 200, 1000);
  }
});

redis.on("connect", () => {
  console.log("Connecting to Cloud Redis...");
});

redis.on("ready", () => {
  isRedisHealthy = true;
  console.log("Successfully connected and ready on Cloud Redis database.");
});

redis.on("error", (error) => {
  isRedisHealthy = false;
  // Log once as a warning instead of spamming full error stack traces on every single request
  console.warn("Cloud Redis is offline (using high-performance in-memory fallback):", error.message);
});

redis.on("close", () => {
  isRedisHealthy = false;
});

redis.on("end", () => {
  isRedisHealthy = false;
  console.log("Redis connection retry attempts exhausted. Operating permanently in-memory fallback mode.");
});

/**
 * Wraps a promise in a timeout to guarantee it completes or rejects within the specified time.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Redis operation timeout after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

/**
 * Checks if a player's request is within acceptable speed parameters using Redis.
 * This ensures that even across multiple process restarts or horizontal scaling,
 * anti-cheat parameters are persistent and shared.
 * 
 * @param userId - The ID of the Commander
 * @param actionPath - The API route path
 * @param minIntervalMs - The minimum allowed interval in milliseconds (default 150ms)
 * @returns Promise<boolean> - true if request is valid, false if blocked (speed hack detected)
 */
export async function checkSpeedHack(userId: string, actionPath: string, minIntervalMs: number = 150): Promise<boolean> {
  const redisKey = `anticheat:speed:${userId}:${actionPath}`;
  const now = Date.now();

  // If Redis is not healthy or not ready, immediately use the local in-memory fallback (0ms latency)
  if (!isRedisHealthy || redis.status !== "ready") {
    const lastTime = localCache.get(redisKey);
    if (lastTime) {
      const diff = now - lastTime;
      if (diff < minIntervalMs) {
        console.warn(`[Anti-Speed-Hack] [Local Cache] Blocked rapid request from user ${userId} on ${actionPath} (Interval: ${diff}ms)`);
        return false;
      }
    }
    localCache.set(redisKey, now);
    return true;
  }

  try {
    // Retrieve the timestamp of the last executed request from Cloud Redis with a strict 400ms timeout
    const lastTimeStr = await withTimeout(redis.get(redisKey), 400);
    
    if (lastTimeStr) {
      const lastTime = parseInt(lastTimeStr, 10);
      const diff = now - lastTime;
      
      if (diff < minIntervalMs) {
        console.warn(`[Anti-Speed-Hack] Cloud Redis blocked rapid request from user ${userId} on ${actionPath} (Interval: ${diff}ms)`);
        return false; // Violates minimum interval
      }
    }

    // Update with current timestamp and set a TTL of 5000ms, with a strict 400ms timeout
    await withTimeout(redis.set(redisKey, now.toString(), "PX", 5000), 400);
    
    // Also mirror to local cache for safety
    localCache.set(redisKey, now);
    return true;
  } catch (err) {
    // Fallback to allow requests in case of a Redis network issue, ensuring high availability
    isRedisHealthy = false;
    
    // Perform local in-memory validation
    const lastTime = localCache.get(redisKey);
    if (lastTime) {
      const diff = now - lastTime;
      if (diff < minIntervalMs) {
        return false;
      }
    }
    localCache.set(redisKey, now);
    return true;
  }
}

