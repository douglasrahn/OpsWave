import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";

const MAKE_API_KEY = process.env.MAKE_API_KEY;
const MAKE_API_BASE_URL = "https://us1.make.com/api/v2";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  app.get("/api/scenarios/:scenarioId", async (req, res) => {
    try {
      const { scenarioId } = req.params;
      const response = await fetch(`${MAKE_API_BASE_URL}/scenarios/${scenarioId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching scenario:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  app.post("/api/scenarios/:scenarioId/:action", async (req, res) => {
    try {
      const { scenarioId, action } = req.params;
      if (action !== 'activate' && action !== 'deactivate') {
        return res.status(400).json({ message: 'Invalid action' });
      }

      const response = await fetch(`${MAKE_API_BASE_URL}/scenarios/${scenarioId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error updating scenario:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}