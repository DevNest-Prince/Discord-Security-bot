import { Router } from "express";
import os from "os";

export function createAdminRoutes(): Router {
  const router = Router();

  router.get("/stats", (req, res) => {
    const memory = process.memoryUsage();
    return res.json({
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      cpu_count: os.cpus().length,
      free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
      total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
      process_memory_mb: Math.round(memory.rss / 1024 / 1024),
      heap_used_mb: Math.round(memory.heapUsed / 1024 / 1024),
    });
  });

  return router;
}
