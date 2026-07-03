import Redis from "ioredis";

// Hardcoded Cloud Redis credentials configured permanently
// Disabling offline queue and configuring a fast connection timeout to avoid hanging the API server
export const redis = new Redis({
  host: 'note-believe-rosegold-84519.db.redis.io',
  port: 14372,
  password: 'i73aF6P0isDnIWJTBq4X9Rw1oANUV9Ie',
  lazyConnect: true, // Non-blocking lazy connection
  maxRetriesPerRequest: 1, // Fail fast on requests if connection drops
  connectTimeout: 2000, // Timeout connection after 2 seconds
  enableOfflineQueue: true, // Allow commands to queue while connection is establishing
});

redis.on("connect", () => {
  console.log("Successfully connected to Cloud Redis database at note-believe-rosegold-84519.db.redis.io");
});

redis.on("error", (error) => {
  console.error("Cloud Redis connection or operation error:", error);
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

  try {
    // Retrieve the timestamp of the last executed request from Cloud Redis with a strict 800ms timeout
    const lastTimeStr = await withTimeout(redis.get(redisKey), 800);
    
    if (lastTimeStr) {
      const lastTime = parseInt(lastTimeStr, 10);
      const diff = now - lastTime;
      
      if (diff < minIntervalMs) {
        console.warn(`[Anti-Speed-Hack] Cloud Redis blocked rapid request from user ${userId} on ${actionPath} (Interval: ${diff}ms)`);
        return false; // Violates minimum interval
      }
    }

    // Update with current timestamp and set a TTL of 5000ms, with a strict 800ms timeout
    await withTimeout(redis.set(redisKey, now.toString(), "PX", 5000), 800);
    return true;
  } catch (err) {
    // Fallback to allow requests in case of a Redis network issue, ensuring high availability
    console.error("Anti-cheat Redis check failed, falling back to permissive allow:", err);
    return true;
  }
}
