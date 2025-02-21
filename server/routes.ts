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

      // Transform the Make.com response to match our frontend schema
      const transformedData = {
        scenario: {
          id: data.id,
          name: data.name,
          teamId: data.teamId,
          isActive: data.status === 'active',
          isPaused: data.status === 'suspended',
          hookId: data.hookId,
          deviceId: data.deviceId,
          deviceScope: data.deviceScope,
          concept: data.concept,
          description: data.description || '',
          folderId: data.folderId,
          slots: data.slots,
          isinvalid: data.isinvalid || false,
          islinked: data.islinked || false,
          islocked: data.islocked || false,
          usedPackages: data.usedPackages || [],
          lastEdit: data.lastEdit,
          scheduling: data.scheduling || { type: 'manual' },
          iswaiting: data.iswaiting || false,
          dlqCount: data.dlqCount || 0,
          allDlqCount: data.allDlqCount || 0,
          nextExec: data.nextExec,
          created: data.created,
          chainingRole: data.chainingRole || 'none'
        }
      };

      res.json(transformedData);
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

      const transformedData = {
        scenario: {
          id: statusData.id,
          name: statusData.name,
          teamId: statusData.teamId,
          isActive: statusData.status === 'active',
          isPaused: statusData.status === 'suspended',
          hookId: statusData.hookId,
          deviceId: statusData.deviceId,
          deviceScope: statusData.deviceScope,
          concept: statusData.concept,
          description: statusData.description || '',
          folderId: statusData.folderId,
          slots: statusData.slots,
          isinvalid: statusData.isinvalid || false,
          islinked: statusData.islinked || false,
          islocked: statusData.islocked || false,
          usedPackages: statusData.usedPackages || [],
          lastEdit: statusData.lastEdit,
          scheduling: statusData.scheduling || { type: 'manual' },
          iswaiting: statusData.iswaiting || false,
          dlqCount: statusData.dlqCount || 0,
          allDlqCount: statusData.allDlqCount || 0,
          nextExec: statusData.nextExec,
          created: statusData.created,
          chainingRole: statusData.chainingRole || 'none'
        }
      };

      res.json(transformedData);
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