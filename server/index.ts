import express from "express";
import { createServer } from "http";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";

const app = express();
const PORT = 5000;

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  try {
    console.log("Starting server initialization...");

    // Create HTTP server
    const server = createServer(app);

    if (process.env.NODE_ENV !== 'production') {
      // Setup Vite development server first
      console.log("Setting up Vite for development...");
      await setupVite(app, server);
    }

    // Register API routes after Vite setup
    console.log("Registering routes...");
    registerRoutes(app);

    // Error handling middleware must be last
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // Function to forcefully close server if needed
    const forceCloseServer = () => {
      return new Promise<void>((resolve) => {
        if (server.listening) {
          console.log('Force closing existing server...');
          server.close(() => {
            console.log('Server closed');
            resolve();
          });
          // Force close any remaining connections
          setTimeout(() => {
            resolve();
          }, 1000);
        } else {
          resolve();
        }
      });
    };

    // Handle server shutdown gracefully
    const cleanup = async () => {
      console.log('Shutting down server...');
      await forceCloseServer();
      process.exit(0);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    let retries = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retries < maxRetries) {
      try {
        // Ensure the server is not already listening
        await forceCloseServer();

        await new Promise<void>((resolve, reject) => {
          // Clear any existing error handlers
          server.removeAllListeners('error');

          server.listen(PORT, '0.0.0.0')
            .once('listening', () => {
              console.log(`Server running at http://0.0.0.0:${PORT}`);
              resolve();
            })
            .once('error', (err: any) => {
              console.error(`Server error on attempt ${retries + 1}:`, err);
              if (err.code === 'EADDRINUSE') {
                console.log(`Port ${PORT} is in use, attempting to close existing connection...`);
                reject(err);
              } else {
                console.error('Server failed to start:', err);
                reject(err);
              }
            });
        });
        break; // If successful, exit the retry loop
      } catch (err) {
        retries++;
        if (retries === maxRetries) {
          console.error(`Failed to start server after ${maxRetries} attempts`);
          throw err;
        }
        console.log(`Retrying in ${retryDelay}ms... (Attempt ${retries} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

console.log('Starting server...');
startServer();