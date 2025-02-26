import { z } from "zod";

// Success response schema for scenario endpoints based on Make.com API documentation
const scenarioResponseSchema = z.object({
  scenario: z.object({
    id: z.number(),
    name: z.string(),
    isActive: z.boolean(),
    teamId: z.number(),
    description: z.string(),
    lastEdit: z.string(),
    nextExec: z.string().optional(),
    created: z.string(),
  }),
});

export type ScenarioResponse = z.infer<typeof scenarioResponseSchema>;

/**
 * Makes an authenticated request to the Make.com API through our backend proxy
 */
async function makeRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  try {
    const method = options.method || "GET";
    console.log(`[Make.com API] Making ${method} request:`, {
      endpoint,
      method,
      options,
    });

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
    });

    const contentType = response.headers.get("content-type");
    console.log('[Make.com API] Response content type:', contentType);

    const responseText = await response.text();
    console.log('[Make.com API] Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[Make.com API] Parsed response:', data);
    } catch (error) {
      console.error('[Make.com API] Failed to parse response as JSON:', error);
      throw new Error('Invalid API response format');
    }

    if (!response.ok) {
      const errorMessage = data.error || `API request failed with status ${response.status}`;
      console.error("[Make.com API] Error response:", data);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("[Make.com API] Request failed:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to communicate with Make.com API");
  }
}

/**
 * Get the current status of a scenario
 */
export async function getScenarioStatus(
  scenarioId: string,
): Promise<ScenarioResponse> {
  console.log(`[Make.com API] Getting status for scenario ${scenarioId}`);
  try {
    const rawData = await makeRequest(`/api/scenarios/${scenarioId}`);

    // Parse and validate the raw API response
    const validatedData = scenarioResponseSchema.safeParse(rawData);
    if (!validatedData.success) {
      console.error("[Make.com API] Schema validation failed:", validatedData.error);
      throw new Error("Invalid API response format");
    }

    console.log("[Make.com API] Validated data:", validatedData.data);
    return validatedData.data;
  } catch (error) {
    console.error("[Make.com API] getScenarioStatus failed:", error);
    throw error;
  }
}

/**
 * Toggle a scenario's state
 */
export async function toggleScenario(
  scenarioId: string,
  activate: boolean,
): Promise<ScenarioResponse> {
  console.log(`[Make.com API] Toggling scenario ${scenarioId} to ${activate ? "active" : "inactive"}`);
  try {
    // Make direct request to toggle endpoint
    const action = activate ? "start" : "stop";
    const response = await makeRequest(`/api/scenarios/${scenarioId}/${action}`, { 
      method: "POST" 
    });

    // Validate response format
    const validatedData = scenarioResponseSchema.safeParse(response);
    if (!validatedData.success) {
      console.error("[Make.com API] Schema validation failed:", validatedData.error);
      throw new Error("Invalid API response format");
    }

    console.log(`[Make.com API] Successfully ${action}ed scenario:`, validatedData.data);
    return validatedData.data;
  } catch (error) {
    console.error(`[Make.com API] Failed to ${activate ? "start" : "stop"} scenario:`, error);
    throw error;
  }
}
