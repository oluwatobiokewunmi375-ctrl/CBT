import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  enableAutoPipelining: true,
  lazyConnect: false,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("ready", () => {
  console.log("Redis is ready");
});

redis.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

export default redis;