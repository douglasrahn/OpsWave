import type { Express } from "express";
import fetch from 'node-fetch';

const MAKE_API_KEY = process.env.MAKE_API_KEY;
const MAKE_API_BASE_URL = 'https://eu1.make.com/api/v2';  // Updated to eu1 endpoint

export function registerRoutes(app: Express) {
  // Get scenario status
  app.get('/api/scenarios/:scenarioId', async (req, res) => {
    try {
      if (!MAKE_API_KEY) {
        console.error('Make.com API key not found in environment');
        return res.status(500).json({
          error: 'Make.com API key not configured'
        });
      }

      const { scenarioId } = req.params;
      console.log(`Fetching scenario status for ID: ${scenarioId}`);

      const response = await fetch(`${MAKE_API_BASE_URL}/scenarios/${scenarioId}`, {
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Make.com API error:', {
          status: response.status,
          statusText: response.statusText
        });

        return res.status(response.status).json({
          error: `Failed to fetch scenario status: ${response.statusText}`
        });
      }

      const data = await response.json();
      console.log('Make.com API response:', data);
      res.json(data);
    } catch (error) {
      console.error('API Request failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Toggle scenario status
  app.post('/api/scenarios/:scenarioId/:action', async (req, res) => {
    try {
      if (!MAKE_API_KEY) {
        console.error('Make.com API key not found in environment');
        return res.status(500).json({
          error: 'Make.com API key not configured'
        });
      }

      const { scenarioId, action } = req.params;
      console.log(`Toggling scenario ${scenarioId} with action: ${action}`);

      if (action !== 'start' && action !== 'stop') {
        return res.status(400).json({
          error: 'Invalid action. Must be either "start" or "stop"'
        });
      }

      const response = await fetch(`${MAKE_API_BASE_URL}/scenarios/${scenarioId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Make.com API error:', {
          status: response.status,
          statusText: response.statusText
        });

        return res.status(response.status).json({
          error: `Failed to ${action} scenario: ${response.statusText}`
        });
      }

      const data = await response.json();
      console.log('Make.com API response:', data);
      res.json(data);
    } catch (error) {
      console.error('API Request failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });
}