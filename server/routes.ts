import type { Express, Request, Response } from "express";
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Prioritize Replit secrets over local .env
const MAKE_API_KEY = process.env.REPLIT_MAKE_API_KEY || process.env.MAKE_API_KEY;
const MAKE_API_BASE_URL = 'https://us1.make.com/api/v2';
const MAKE_ORG_ID = process.env.REPLIT_MAKE_ORG_ID || process.env.MAKE_ORG_ID || '493039';
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

// Validate required environment variables
if (!MAKE_API_KEY) {
  console.warn('Warning: MAKE_API_KEY not set. Make.com API calls will fail.');
}

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

type Client = z.infer<typeof clientSchema>;

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load initial data from client directory if server data doesn't exist
async function initializeDataIfNeeded() {
  try {
    await fs.access(CLIENTS_FILE);
  } catch {
    const initialDataPath = path.join(process.cwd(), 'client', 'src', 'data', 'clients.json');
    try {
      const initialData = await fs.readFile(initialDataPath, 'utf-8');
      await fs.writeFile(CLIENTS_FILE, initialData, 'utf-8');
      console.log('Initialized server data from client data');
    } catch (error) {
      console.error('Error initializing data:', error);
      // Create empty data structure if initial data is not available
      await fs.writeFile(CLIENTS_FILE, JSON.stringify({ clients: [] }, null, 2), 'utf-8');
    }
  }
}

export function registerRoutes(app: Express) {
  // Initialize data on startup
  initializeDataIfNeeded().catch(console.error);

  // Get client by UID
  app.get('/api/clients/user/:uid', async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
      const data = JSON.parse(rawData);

      const client = data.clients.find((c: Client) => 
        c.users.some(user => user.uid === uid)
      );

      if (!client) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(client);
    } catch (error) {
      console.error('Error fetching client by UID:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Client data update endpoint
  app.patch('/api/clients/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      console.log('Updating client:', id, 'with data:', updateData);

      // Validate the update data
      try {
        clientSchema.parse(updateData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Validation error:', error.issues);
          return res.status(400).json({
            error: 'Invalid data format',
            details: error.issues.map(issue => issue.message)
          });
        }
      }

      await ensureDataDirectory();

      // Read current data
      let data;
      try {
        const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
        data = JSON.parse(rawData);
        console.log('Current data:', data);
      } catch (error) {
        console.error('Error reading clients file:', error);
        return res.status(500).json({ error: 'Error reading clients data' });
      }

      // Find and update the client
      const clientIndex = data.clients.findIndex((c: Client) => c.clientId === id);
      if (clientIndex === -1) {
        console.error('Client not found:', id);
        return res.status(404).json({ error: 'Client not found' });
      }

      // Update the client data
      data.clients[clientIndex] = {
        ...data.clients[clientIndex],
        ...updateData
      };

      console.log('Updated data:', data);

      // Write back to file
      try {
        await fs.writeFile(CLIENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log('File write successful');
      } catch (error) {
        console.error('Error writing to clients file:', error);
        return res.status(500).json({ error: 'Error saving client data' });
      }

      // Also update the client-side data file to keep it in sync
      const clientDataPath = path.join(process.cwd(), 'client', 'src', 'data', 'clients.json');
      try {
        await fs.writeFile(clientDataPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Client-side data updated');
      } catch (error) {
        console.error('Error updating client-side data:', error);
        // Don't fail the request if client-side update fails
      }

      return res.json(data.clients[clientIndex]);
    } catch (error) {
      console.error('Error updating client:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create new client endpoint
  app.post('/api/clients', async (req: Request, res: Response) => {
    try {
      const newClient = req.body;
      console.log('Creating new client:', newClient);

      // Validate the new client data
      try {
        clientSchema.parse(newClient);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Validation error:', error.issues);
          return res.status(400).json({
            error: 'Invalid data format',
            details: error.issues.map(issue => issue.message)
          });
        }
      }

      await ensureDataDirectory();

      // Read current data
      let data;
      try {
        const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
        data = JSON.parse(rawData);
      } catch (error) {
        console.log('No existing clients file, creating new one');
        data = { clients: [] };
      }

      // Add new client
      data.clients.push(newClient);
      console.log('Updated data with new client:', data);

      // Write back to file
      try {
        await fs.writeFile(CLIENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log('File write successful');
      } catch (error) {
        console.error('Error writing to clients file:', error);
        return res.status(500).json({ error: 'Error saving client data' });
      }

      return res.status(201).json(newClient);
    } catch (error) {
      console.error('Error creating client:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create new user endpoint
  app.post('/api/clients/:clientId/users', async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const newUser = req.body;

      await ensureDataDirectory();

      // Read current data
      let data;
      try {
        const rawData = await fs.readFile(CLIENTS_FILE, 'utf-8');
        data = JSON.parse(rawData);
      } catch (error) {
        return res.status(500).json({ error: 'Error reading clients data' });
      }

      // Find the client
      const clientIndex = data.clients.findIndex((c: Client) => c.clientId === clientId);
      if (clientIndex === -1) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Add new user
      data.clients[clientIndex].users.push(newUser);

      // Write back to file
      try {
        await fs.writeFile(CLIENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (error) {
        console.error('Error writing to clients file:', error);
        return res.status(500).json({ error: 'Error saving user data' });
      }

      return res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
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