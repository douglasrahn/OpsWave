import type { Express } from "express";
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const MAKE_API_KEY = process.env.MAKE_API_KEY;
const MAKE_API_BASE_URL = 'https://us1.make.com/api/v2';
const MAKE_ORG_ID = '493039';

// Client data validation schema
const clientSchema = z.object({
  clientId: z.string(),
  companyName: z.string().min(1),
  url: z.string().url(),
  users: z.array(z.object({
    email: z.string().email(),
    role: z.string(),
    uid: z.string()
  }))
});

export function registerRoutes(app: Express) {
  // Client data update endpoint
  app.patch('/api/clients/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate the update data
      try {
        clientSchema.parse(updateData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Invalid data format',
            details: error.issues.map(issue => issue.message)
          });
        }
      }

      // Read current data
      const dataPath = path.join(process.cwd(), 'client', 'src', 'data', 'clients.json');
      const rawData = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(rawData);

      // Find and update the client
      const clientIndex = data.clients.findIndex((c: any) => c.clientId === id);
      if (clientIndex === -1) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Update the client data
      data.clients[clientIndex] = {
        ...data.clients[clientIndex],
        ...updateData
      };

      // Write back to file
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));

      res.json(data.clients[clientIndex]);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({
        error: 'Failed to update client data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Existing Make.com API routes remain unchanged
  app.get('/api/scenarios/:scenarioId', async (req, res) => {
    try {
      const { scenarioId } = req.params;
      console.log(`Making request to Make.com API for scenario ${scenarioId}`);

      const response = await fetch(`${MAKE_API_BASE_URL}/organizations/${MAKE_ORG_ID}/scenarios/${scenarioId}`, {
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error("[Make.com API] Request failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("[Make.com API] Error response:", errorText);
        return res.status(response.status).json({
          error: `API request failed with status ${response.status}: ${response.statusText}`,
          details: errorText
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('API Request failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'A network error occurred while communicating with Make.com API'
      });
    }
  });

  app.post('/api/scenarios/:scenarioId/:action', async (req, res) => {
    try {
      const { scenarioId, action } = req.params;

      if (action !== 'start' && action !== 'stop') {
        return res.status(400).json({
          error: 'Invalid action. Must be either "start" or "stop"'
        });
      }

      console.log(`Making ${action} request to Make.com API for scenario ${scenarioId}`);

      const response = await fetch(`${MAKE_API_BASE_URL}/organizations/${MAKE_ORG_ID}/scenarios/${scenarioId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error("[Make.com API] Request failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("[Make.com API] Error response:", errorText);
        return res.status(response.status).json({
          error: `Failed to ${action} scenario: ${response.statusText}`,
          details: errorText
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('API Request failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'A network error occurred while communicating with Make.com API'
      });
    }
  });
}