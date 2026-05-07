import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

/**
 * Liveness probe (Is the service running?)
 */
router.get("/live", async (req: Request, res: Response) => {
  res.json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe (Is the service ready to accept traffic?)
 */
router.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    await redis.ping();

    res.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
        redis: "ok",
      },
    });
  } catch (err: any) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

/**
 * Startup probe (Did the service start correctly?)
 */
router.get("/startup", async (req: Request, res: Response) => {
  try {
    res.json({
      status: "started",
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "startup_failed",
      error: err.message,
    });
  }
});

export default router;