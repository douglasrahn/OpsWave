import type { Express } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import fetch from 'node-fetch';

const MAKE_API_KEY = process.env.MAKE_API_KEY;
const MAKE_API_BASE_URL = 'https://eu1.make.com/api/v2';

interface MakeApiResponse {
  id: string;
  name: string;
  active: boolean;
  nextExec?: string;
}

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
      console.log('[Make.com API] Request details:', {
        url,
        method: 'GET',
        headers: { ...headers, 'Authorization': 'Token [REDACTED]' }
      });

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const responseText = await response.text();
      console.log('[Make.com API] Raw response:', responseText);

      if (!response.ok) {
        console.error('[Make.com API] Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });

        if (response.status === 404) {
          return res.status(404).json({
            error: 'Scenario not found. Please verify your scenario ID and API token permissions.'
          });
        }

        return res.status(response.status).json({
          error: `Make.com API error: ${response.statusText}`,
          details: responseText
        });
      }

      let data: MakeApiResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Make.com API] Failed to parse response as JSON:', parseError);
        return res.status(500).json({
          error: 'Invalid response format from Make.com API',
          details: responseText
        });
      }

      // Validate and transform the response
      if (!data || typeof data !== 'object' || typeof data.active === 'undefined') {
        console.error('[Make.com API] Invalid response structure:', data);
        return res.status(500).json({
          error: 'Invalid response structure from Make.com API'
        });
      }

      const scenarioData = {
        isActive: data.active,
        status: data.active ? 'active' : 'inactive',
        name: data.name,
        nextExec: data.nextExec
      };

      res.json(scenarioData);
    } catch (error) {
      console.error('[Make.com API] Request failed:', error);
      res.status(500).json({
        error: 'Failed to fetch scenario status',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Toggle scenario status
  app.post('/api/scenarios/:scenarioId/:action', async (req, res) => {
    try {
      const { scenarioId, action } = req.params;

      if (action !== 'activate' && action !== 'deactivate') {
        return res.status(400).json({
          error: 'Invalid action. Must be either "activate" or "deactivate"'
        });
      }

      console.log(`[Make.com API] ${action.toUpperCase()} scenario ${scenarioId}`);

      const url = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}/${action}`;
      const headers = {
        'Authorization': `Token ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      };
      console.log('[Make.com API] Request details:', {
        url,
        method: 'POST',
        headers: { ...headers, 'Authorization': 'Token [REDACTED]' }
      });

      const response = await fetch(url, {
        method: 'POST',
        headers
      });

      const responseText = await response.text();
      console.log('[Make.com API] Raw response:', responseText);

      if (!response.ok) {
        console.error('[Make.com API] Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });

        if (response.status === 404) {
          return res.status(404).json({
            error: 'Scenario not found. Please verify your scenario ID and API token permissions.'
          });
        }

        return res.status(response.status).json({
          error: `Make.com API error: ${response.statusText}`,
          details: responseText
        });
      }

      // Get the updated status to confirm the change
      const statusUrl = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}`;
      const statusResponse = await fetch(statusUrl, { headers });
      const statusData = await statusResponse.json() as MakeApiResponse;

      if (!statusData || typeof statusData.active === 'undefined') {
        throw new Error('Invalid status response after toggle');
      }

      const success = action === 'activate' ? statusData.active : !statusData.active;

      res.json({
        success,
        action,
        currentStatus: statusData.active ? 'active' : 'inactive',
        response: responseText ? JSON.parse(responseText) : null
      });
    } catch (error) {
      console.error('[Make.com API] Request failed:', error);
      res.status(500).json({
        error: 'Failed to toggle scenario status',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}