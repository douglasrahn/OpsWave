import { z } from "zod";

// Error response schema from Make.com API
const errorResponseSchema = z.object({
  detail: z.string().optional(),
  message: z.string().optional(),
  code: z.string().optional(),
});

// Success response schema for scenario endpoints
const scenarioResponseSchema = z.object({
  scenario: z.object({
    id: z.number().or(z.string()).transform(String),
    name: z.string(),
    teamId: z.number().or(z.string()).transform(String),
    isActive: z.boolean(),
    isPaused: z.boolean().optional(),
    hookId: z.string().nullable(),
    deviceId: z.string().nullable(),
    deviceScope: z.string().nullable(),
    concept: z.boolean(),
    description: z.string(),
    folderId: z.string().nullable(),
    slots: z.any().nullable(),
    isinvalid: z.boolean(),
    islinked: z.boolean(),
    islocked: z.boolean(),
    usedPackages: z.array(z.string()),
    lastEdit: z.string(),
    scheduling: z.object({
      type: z.string(),
      interval: z.number().optional(),
    }).optional(),
    iswaiting: z.boolean(),
    dlqCount: z.number(),
    allDlqCount: z.number(),
    nextExec: z.string().optional(),
    created: z.string(),
    chainingRole: z.string(),
  })
});

export type ScenarioResponse = z.infer<typeof scenarioResponseSchema>;

/**
 * Makes an authenticated request to the Make.com API through our backend proxy
 */
async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    console.log(`[Make.com API] Making ${options.method || 'GET'} request to:`, endpoint);

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log response details for debugging
    console.log("[Make.com API] Response status:", response.status);
    console.log("[Make.com API] Response headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();

    if (!response.ok) {
      const parsedError = errorResponseSchema.safeParse(data);
      const errorMessage = parsedError.success
        ? parsedError.data.message || parsedError.data.detail 
        : `API request failed with status ${response.status}`;
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
  const data = await makeRequest(`/api/scenarios/${scenarioId}`);
  return scenarioResponseSchema.parse(data);
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
  return makeRequest(`/api/scenarios/${scenarioId}/start`, { method: 'POST' });
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
  return makeRequest(`/api/scenarios/${scenarioId}/stop`, { method: 'POST' });
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