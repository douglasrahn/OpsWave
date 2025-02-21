import { z } from "zod";

const BASE_URL = "https://us1.make.com/api/v2";

// Error response schema from Make.com API
const errorResponseSchema = z.object({
  detail: z.string().optional(),
  message: z.string().optional(),
  code: z.string().optional(),
});

// Success response schema for scenario endpoints
const scenarioResponseSchema = z.object({
  scenario: z.object({
    id: z.string(),
    name: z.string(),
    isActive: z.boolean(),
    isPaused: z.boolean().optional(),
    nextExec: z.string().optional(),
  })
});

type ScenarioResponse = z.infer<typeof scenarioResponseSchema>;

/**
 * Makes an authenticated request to the Make.com API
 */
async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const apiKey = import.meta.env.VITE_MAKE_API_KEY;
  if (!apiKey) {
    console.error("[Make.com API] No API key found in environment variables");
    throw new Error("Make.com API key not found");
  }

  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Authorization": `Token ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    console.log(`[Make.com API] Making ${options.method || 'GET'} request to:`, endpoint);
    console.log("[Make.com API] Request headers:", headers);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit',
      mode: 'cors',
    }).catch(error => {
      console.error("[Make.com API] Fetch failed:", error);
      throw new Error(`Network request failed: ${error.message}`);
    });

    // Log response status and headers for debugging
    console.log("[Make.com API] Response status:", response.status);
    console.log("[Make.com API] Response headers:", Object.fromEntries(response.headers.entries()));

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("[Make.com API] Failed to parse JSON response:", parseError);
      throw new Error("Invalid JSON response from API");
    }

    if (!response.ok) {
      // Parse error response
      const error = errorResponseSchema.safeParse(data);
      const errorMessage = error.success 
        ? error.data.message || error.data.detail 
        : `API request failed with status ${response.status}`;
      console.error("[Make.com API] Error response:", data);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('[Make.com API] Request failed:', error);
    throw error instanceof Error ? error : new Error('Failed to communicate with Make.com API');
  }
}

/**
 * Get the current status of a scenario
 */
export async function getScenarioStatus(scenarioId: string): Promise<ScenarioResponse> {
  try {
    const data = await makeRequest(`/scenarios/${scenarioId}`);
    return scenarioResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Make.com API] Invalid response format:', error.errors);
      throw new Error('Invalid response format from Make.com API');
    }
    throw error;
  }
}

/**
 * Start a scenario
 */
export async function startScenario(scenarioId: string): Promise<ScenarioResponse> {
  return makeRequest(`/scenarios/${scenarioId}/start`, { method: 'POST' });
}

/**
 * Stop a scenario
 */
export async function stopScenario(scenarioId: string): Promise<ScenarioResponse> {
  return makeRequest(`/scenarios/${scenarioId}/stop`, { method: 'POST' });
}

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