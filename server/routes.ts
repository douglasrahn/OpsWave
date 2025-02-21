import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from 'node-fetch';

const MAKE_API_KEY = process.env.MAKE_API_KEY;
const MAKE_API_BASE_URL = 'https://us1.make.com/api/v2';

export function registerRoutes(app: Express): Server {
  // Get scenario status
  app.get('/api/scenarios/:scenarioId', async (req, res) => {
    try {
      const { scenarioId } = req.params;
      console.log(`[Make.com API] Getting status for scenario ${scenarioId}`);

      const url = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}`;
      const headers = {
        'Authorization': `Token ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.message || 'Failed to fetch scenario status'
        });
      }

      // Return the raw Make.com API response
      // The client will handle the transformation
      res.json(data);
    } catch (error) {
      console.error('[Make.com API] Request failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Toggle scenario status
  app.post('/api/scenarios/:scenarioId/:action', async (req, res) => {
    try {
      const { scenarioId, action } = req.params;

      if (action !== 'start' && action !== 'stop') {
        return res.status(400).json({
          error: 'Invalid action. Must be either "start" or "stop"'
        });
      }

      const url = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}/${action}`;
      const headers = {
        'Authorization': `Token ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.message || `Failed to ${action} scenario`
        });
      }

      // Get updated scenario status
      const statusResponse = await fetch(`${MAKE_API_BASE_URL}/scenarios/${scenarioId}`, { headers });
      const statusData = await statusResponse.json();

      // Return the raw Make.com API response
      res.json(statusData);
    } catch (error) {
      console.error('[Make.com API] Request failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
