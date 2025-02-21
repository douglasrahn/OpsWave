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

      // Log the full request details (with redacted token)
      console.log('[Make.com API] Request details:', {
        url,
        method: 'GET',
        headers: { ...headers, 'Authorization': 'Token [REDACTED]' }
      });

      const response = await fetch(url, { headers });

      // Log response details
      console.log('[Make.com API] Response status:', response.status);
      console.log('[Make.com API] Response headers:', response.headers.raw());

      // Get response text first for logging
      const responseText = await response.text();
      console.log('[Make.com API] Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('[Make.com API] Failed to parse response as JSON:', error);
        return res.status(500).json({
          error: 'Invalid JSON response from Make.com API'
        });
      }

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

      // Log the full request details (with redacted token)
      console.log('[Make.com API] Request details:', {
        url,
        method: 'POST',
        headers: { ...headers, 'Authorization': 'Token [REDACTED]' }
      });

      const response = await fetch(url, {
        method: 'POST',
        headers
      });

      // Log response details
      console.log('[Make.com API] Response status:', response.status);
      console.log('[Make.com API] Response headers:', response.headers.raw());

      // Get response text first for logging
      const responseText = await response.text();
      console.log('[Make.com API] Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('[Make.com API] Failed to parse response as JSON:', error);
        return res.status(500).json({
          error: 'Invalid JSON response from Make.com API'
        });
      }

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.message || `Failed to ${action} scenario`
        });
      }

      // Get updated scenario status with the same detailed logging
      console.log('[Make.com API] Fetching updated scenario status');
      const statusResponse = await fetch(`${MAKE_API_BASE_URL}/scenarios/${scenarioId}`, { headers });
      const statusText = await statusResponse.text();
      console.log('[Make.com API] Status response:', statusText);

      const statusData = JSON.parse(statusText);
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