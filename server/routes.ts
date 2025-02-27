import type { Express, Request, Response } from "express";
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export function registerRoutes(app: Express) {
  // Get all clients
  app.get('/api/clients', async (req: Request, res: Response) => {
    try {
      const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
      const data = JSON.parse(rawData);
      return res.json(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get single client
  app.get('/api/clients/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
      const data = JSON.parse(rawData);

      const client = data.clients.find((c: any) => c.clientId === id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      return res.json(client);
    } catch (error) {
      console.error('Error fetching client:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update client
  app.patch('/api/clients/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Read current data
      const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
      const data = JSON.parse(rawData);

      // Find and update the client
      const clientIndex = data.clients.findIndex((c: any) => c.clientId === id);
      if (clientIndex === -1) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Update the client data while preserving users array
      data.clients[clientIndex] = {
        ...data.clients[clientIndex],
        companyName: updateData.companyName,
        url: updateData.url,
      };

      // Write back to file
      await fs.writeFile(CLIENTS_FILE, JSON.stringify(data, null, 2));
      return res.json(data.clients[clientIndex]);
    } catch (error) {
      console.error('Error updating client:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create new client
  app.post('/api/clients', async (req: Request, res: Response) => {
    try {
      const newClient = req.body;

      // Ensure data directory exists
      await ensureDataDirectory();

      // Read current data or initialize new data structure
      let data;
      try {
        const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
        data = JSON.parse(rawData);
      } catch {
        data = { clients: [] };
      }

      // Add new client
      data.clients.push({
        ...newClient,
        users: [] // Initialize empty users array for new clients
      });

      // Write back to file
      await fs.writeFile(CLIENTS_FILE, JSON.stringify(data, null, 2));
      return res.status(201).json(newClient);
    } catch (error) {
      console.error('Error creating client:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  // Create new user
  app.post('/api/clients/:clientId/users', async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const newUser = req.body;

      await ensureDataDirectory();

      // Read current data
      const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
      const data = JSON.parse(rawData);

      // Find the client
      const clientIndex = data.clients.findIndex((c: any) => c.clientId === clientId);
      if (clientIndex === -1) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Add new user
      data.clients[clientIndex].users.push(newUser);

      // Write back to file
      await fs.writeFile(CLIENTS_FILE, JSON.stringify(data, null, 2));
      console.log('Successfully saved new user to:', CLIENTS_FILE);

      return res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Existing Make.com API routes
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