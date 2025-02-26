import type { Express } from "express";
import fetch from 'node-fetch';

const MAKE_API_KEY = process.env.MAKE_API_KEY;
const MAKE_API_BASE_URL = 'https://us1.make.com/api/v2';  // Reverted back to us1 endpoint

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
      const url = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}`;
      console.log(`[Make.com] Fetching scenario status, URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Check response content type
      const contentType = response.headers.get('content-type');
      console.log('[Make.com] Response content type:', contentType);

      const responseText = await response.text();
      console.log('[Make.com] Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[Make.com] Parsed response:', data);
      } catch (parseError) {
        console.error('[Make.com] Failed to parse response as JSON:', parseError);
        return res.status(500).json({
          error: 'Invalid API response format'
        });
      }

      if (!response.ok) {
        console.error('[Make.com] API error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });

        return res.status(response.status).json({
          error: `Failed to fetch scenario status: ${response.statusText}`
        });
      }

      res.json(data);
    } catch (error) {
      console.error('[Make.com] API Request failed:', error);
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
      const url = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}/${action}`;
      console.log(`[Make.com] Toggling scenario, URL: ${url}`);

      if (action !== 'start' && action !== 'stop') {
        return res.status(400).json({
          error: 'Invalid action. Must be either "start" or "stop"'
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      console.log('[Make.com] Response content type:', contentType);

      const responseText = await response.text();
      console.log('[Make.com] Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[Make.com] Parsed response:', data);
      } catch (parseError) {
        console.error('[Make.com] Failed to parse response as JSON:', parseError);
        return res.status(500).json({
          error: 'Invalid API response format'
        });
      }

      if (!response.ok) {
        console.error('[Make.com] API error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });

        return res.status(response.status).json({
          error: `Failed to ${action} scenario: ${response.statusText}`
        });
      }

      res.json(data);
    } catch (error) {
      console.error('[Make.com] API Request failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });
}