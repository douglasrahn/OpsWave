import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";
import { Server } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

let server: Server | null = null;

// Function to check if a port is in use
const isPortInUse = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const tester = createServer()
      .once('error', () => {
        resolve(true);
      })
      .once('listening', () => {
        tester.once('close', () => {
          resolve(false);
        }).close();
      })
      .listen(port, '0.0.0.0');
  });
};

const startServer = async () => {
  try {
    log("[Server] Starting server initialization...");

    // If there's an existing server, close it properly
    if (server) {
      log("[Server] Closing existing server instance...");
      await new Promise<void>((resolve) => {
        server!.close(() => {
          server = null;
          resolve();
        });
      });
    }

    log("[Server] Registering routes...");
    server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`[Server] Error handler caught: ${message}`);
      res.status(status).json({ message });
    });

    const PORT = 5000;

    // Check if port is in use
    const portInUse = await isPortInUse(PORT);
    if (portInUse) {
      log(`[Server] Port ${PORT} is already in use. Waiting for it to be available...`);
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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
    if (server) {
      server.close();
      server = null;
    }
    process.exit(1);
  }
};

// Handle cleanup on process termination
process.on('SIGTERM', () => {
  log('[Server] Received SIGTERM signal');
  if (server) {
    server.close(() => {
      log('[Server] Server gracefully terminated');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  log('[Server] Received SIGINT signal');
  if (server) {
    server.close(() => {
      log('[Server] Server gracefully terminated');
      process.exit(0);
    });
  }
});

log('[Server] Initial startup sequence beginning...');
startServer();