import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";
import { Server } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic request logging middleware with path logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  log(`[Server] Incoming request: ${req.method} ${path}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`[Server] ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

let server: Server | null = null;

// Function to check if a port is in use
const isPortInUse = async (port: number): Promise<boolean> => {
  log(`[Server] Checking if port ${port} is in use...`);
  return new Promise((resolve) => {
    const tester = createServer()
      .once('error', () => {
        log(`[Server] Port ${port} is in use`);
        resolve(true);
      })
      .once('listening', () => {
        tester.once('close', () => {
          log(`[Server] Port ${port} is available`);
          resolve(false);
        }).close();
      })
      .listen(port, '0.0.0.0');
  });
};

// Function to wait for port to be available
const waitForPort = async (port: number, maxAttempts = 5): Promise<void> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log(`[Server] Attempt ${attempt}/${maxAttempts} to wait for port ${port}`);
    const inUse = await isPortInUse(port);
    if (!inUse) return;
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    log(`[Server] Waiting ${delay}ms before next attempt`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Port ${port} is still in use after ${maxAttempts} attempts`);
};

// Function to gracefully shutdown server
const shutdownServer = async (): Promise<void> => {
  if (server) {
    log("[Server] Initiating graceful shutdown...");
    return new Promise<void>((resolve) => {
      server!.close(() => {
        log("[Server] Server closed successfully");
        server = null;
        resolve();
      });
    });
  }
  log("[Server] No server instance to shutdown");
  return Promise.resolve();
};

const startServer = async () => {
  try {
    log("[Server] Initial startup sequence beginning...");
    log("[Server] Starting server initialization...");

    // Ensure any existing server is properly shutdown
    await shutdownServer();

    const PORT = 5000;
    await waitForPort(PORT);

    log("[Server] Registering routes...");
    server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`[Server] Error handler caught: ${message}`);
      res.status(status).json({ message });
    });

    // Setup Vite or static serving based on environment
    if (app.get("env") === "development") {
      log("[Server] Setting up Vite for development...");
      await setupVite(app, server);
      log("[Server] Vite setup complete");
    } else {
      log("[Server] Setting up static serving...");
      serveStatic(app);
      log("[Server] Static serving setup complete");
    }

    // Start listening after Vite is set up
    server.listen(PORT, "0.0.0.0", () => {
      log(`[Server] Started successfully on port ${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log(`[Server] Port ${PORT} is already in use`);
        server?.close();
      } else {
        log(`[Server] Server error: ${err.message}`);
        throw err;
      }
    });

  } catch (error) {
    log(`[Server] Failed to start server: ${error}`);
    await shutdownServer();
    process.exit(1);
  }
};

// Handle cleanup on process termination
process.on('SIGTERM', async () => {
  log('[Server] Received SIGTERM signal');
  await shutdownServer();
  log('[Server] Server gracefully terminated');
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('[Server] Received SIGINT signal');
  await shutdownServer();
  log('[Server] Server gracefully terminated');
  process.exit(0);
});

log('[Server] Initial startup sequence beginning...');
startServer();