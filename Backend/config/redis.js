import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  console.log("Connected to Redis!");
});

redisConnection.on("error", (err) => {
  console.error("Redis error:", err);
});