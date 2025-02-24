import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

let server: any = null;

const startServer = async () => {
  try {
    log("[Server] Starting server initialization...");

    if (server) {
      log("[Server] Closing existing server instance...");
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }

    log("[Server] Registering routes...");
    server = await registerRoutes(app);
    log("[Server] Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`[Server] Error handler caught: ${message}`);
      res.status(status).json({ message });
      throw err;
    });

    // Temporarily force production mode to bypass Vite setup
    const isDev = false; // app.get("env") === "development";

    if (isDev) {
      log("[Server] Setting up Vite for development...");
      await setupVite(app, server);
      log("[Server] Vite setup complete");
    } else {
      log("[Server] Setting up static serving...");
      serveStatic(app);
      log("[Server] Static serving setup complete");
    }

    const PORT = 5000;
    log(`[Server] Attempting to start server on port ${PORT}...`);

    await new Promise<void>((resolve, reject) => {
      server.listen(PORT, "0.0.0.0", () => {
        log(`[Server] Started successfully on port ${PORT}`);
        resolve();
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`[Server] Port ${PORT} is already in use`);
          server.close();
          reject(new Error(`Port ${PORT} is already in use`));
        } else {
          log(`[Server] Server error: ${err.message}`);
          reject(err);
        }
      });
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