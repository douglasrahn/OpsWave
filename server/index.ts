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

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying to close existing connection...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT, '0.0.0.0');
        }, 1000);
      } else {
        console.error('Server failed to start:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

console.log('Starting server...');
startServer();