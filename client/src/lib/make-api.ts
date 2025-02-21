import { z } from "zod";

// Success response schema for scenario endpoints based on Make.com API documentation
const scenarioResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(['active', 'inactive', 'draft']),
  scheduling: z.object({
    type: z.string(),
    interval: z.number().optional(),
  }).optional(),
  nextExec: z.string().optional(),
  description: z.string().optional(),
  created: z.string().optional(),
  lastEdit: z.string().optional(),
});

export type ScenarioResponse = {
  scenario: {
    id: string;
    name: string;
    isActive: boolean;
    nextExec?: string;
    description?: string;
  };
};

/**
 * Makes an authenticated request to the Make.com API through our backend proxy
 */
async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const method = options.method || 'GET';
    console.log(`[Make.com API] Making ${method} request:`, {
      url: endpoint,
      fullUrl: `${window.location.origin}${endpoint}`,
      method,
      headers: options.headers,
      options
    });

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
    });

    // Log response details for debugging
    console.log("[Make.com API] Response status:", response.status);
    console.log("[Make.com API] Response headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("[Make.com API] Response data:", data);

    if (!response.ok) {
      const errorMessage = data.error || `API request failed with status ${response.status}`;
      console.error("[Make.com API] Error response:", data);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("[Make.com API] Request failed:", error);
    throw error instanceof Error ? error : new Error('Failed to communicate with Make.com API');
  }
}

/**
 * Get the current status of a scenario
 */
export async function getScenarioStatus(scenarioId: string): Promise<ScenarioResponse> {
  console.log(`[Make.com API] Getting status for scenario ${scenarioId}`);
  const rawData = await makeRequest(`/api/scenarios/${scenarioId}`);

  // Parse and validate the raw API response
  const validatedData = scenarioResponseSchema.parse(rawData);
  console.log("[Make.com API] Validated data:", validatedData);

  // Transform the validated data into our application's format
  const transformedData = {
    scenario: {
      id: validatedData.id.toString(),
      name: validatedData.name,
      isActive: validatedData.status === 'active',
      nextExec: validatedData.nextExec,
      description: validatedData.description,
    }
  };
  console.log("[Make.com API] Transformed data:", transformedData);
  return transformedData;
}

/**
 * Start a scenario if it's not already running
 */
export async function startScenario(scenarioId: string): Promise<ScenarioResponse> {
  const status = await getScenarioStatus(scenarioId);
  if (status.scenario.isActive) {
    console.log('[Make.com API] Scenario is already active, skipping start request');
    return status;
  }
  await makeRequest(`/api/scenarios/${scenarioId}/start`, { method: 'POST' });
  return await getScenarioStatus(scenarioId); // Get fresh status after action
}

/**
 * Stop a scenario if it's currently running
 */
export async function stopScenario(scenarioId: string): Promise<ScenarioResponse> {
  const status = await getScenarioStatus(scenarioId);
  if (!status.scenario.isActive) {
    console.log('[Make.com API] Scenario is not active, skipping stop request');
    return status;
  }
  await makeRequest(`/api/scenarios/${scenarioId}/stop`, { method: 'POST' });
  return await getScenarioStatus(scenarioId); // Get fresh status after action
}

/**
 * Toggle a scenario's state
 */
export async function toggleScenario(scenarioId: string, activate: boolean): Promise<ScenarioResponse> {
  console.log(`[Make.com API] Toggling scenario ${scenarioId} to ${activate ? 'active' : 'inactive'}`);
  try {
    const response = activate ?
      await startScenario(scenarioId) :
      await stopScenario(scenarioId);

    console.log(`[Make.com API] Successfully ${activate ? 'started' : 'stopped'} scenario:`, response);
    return response;
  } catch (error) {
    console.error(`[Make.com API] Failed to ${activate ? 'start' : 'stop'} scenario:`, error);
    throw error;
  }
}