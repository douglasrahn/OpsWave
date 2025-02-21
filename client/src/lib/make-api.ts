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
  const headers = new Headers({
    "Authorization": `Token ${apiKey}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  });

  try {
    console.log(`[Make.com API] Making ${options.method || 'GET'} request to:`, endpoint);

    const requestOptions: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      // Don't send credentials for cross-origin requests
      credentials: 'omit',
    };

    console.log("[Make.com API] Request options:", {
      method: requestOptions.method,
      headers: Object.fromEntries(headers.entries()),
      mode: requestOptions.mode,
      credentials: requestOptions.credentials
    });

    const response = await fetch(url, requestOptions);

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
    // Preserve the original error message
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