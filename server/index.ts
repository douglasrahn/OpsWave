import express from "express";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { createServer } from "http";

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
    if (process.env.NODE_ENV !== 'production') {
      // Setup Vite development server first
      const server = createServer(app);
      await setupVite(app, server);
    }

    // Register API routes after Vite setup
    registerRoutes(app);

    // Error handling middleware must be last
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

console.log('Starting server...');
startServer();