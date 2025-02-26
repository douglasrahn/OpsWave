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
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

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
  try {
    const rawData = await makeRequest(`/api/scenarios/${scenarioId}`);

    // Parse and validate the raw API response
    const validatedData = scenarioResponseSchema.safeParse(rawData);
    if (!validatedData.success) {
      console.error("[Make.com API] Schema validation failed:", validatedData.error);
      throw new Error("Invalid API response format");
    }

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
  try {
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

    return validatedData.data;
  } catch (error) {
    console.error(`[Make.com API] Failed to ${activate ? "start" : "stop"} scenario:`, error);
    throw error;
  }
}