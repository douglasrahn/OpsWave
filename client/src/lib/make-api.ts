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
    scheduling: z.object({
      type: z.string(),
      interval: z.number().optional(),
    }).optional(),
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
      url: endpoint,
      fullUrl: `${window.location.origin}${endpoint}`,
      method,
      headers: options.headers,
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

    if (!response.ok) {
      console.error("[Make.com API] Request failed:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("[Make.com API] Error response:", errorText);
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    // Check if we got a JSON response
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[Make.com API] Received non-JSON response:", contentType);
      throw new Error("Invalid API response format - expected JSON");
    }

    const data = await response.json();
    console.log("[Make.com API] Response data:", data);

    if (data.error) {
      console.error("[Make.com API] Error in response:", data.error);
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("[Make.com API] Request failed:", error);
    if (error instanceof Error && error.message.includes("API response format")) {
      throw new Error("Unable to connect to Make.com API. Please check your configuration.");
    }
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
 * Start a scenario if it's not already running
 */
export async function startScenario(
  scenarioId: string,
): Promise<ScenarioResponse> {
  try {
    const status = await getScenarioStatus(scenarioId);
    if (status.scenario.isActive) {
      console.log("[Make.com API] Scenario is already active, skipping start request");
      return status;
    }
    await makeRequest(`/api/scenarios/${scenarioId}/start`, { method: "POST" });
    return await getScenarioStatus(scenarioId); // Get fresh status after action
  } catch (error) {
    console.error("[Make.com API] startScenario failed:", error);
    throw error;
  }
}

/**
 * Stop a scenario if it's currently running
 */
export async function stopScenario(
  scenarioId: string,
): Promise<ScenarioResponse> {
  try {
    const status = await getScenarioStatus(scenarioId);
    if (!status.scenario.isActive) {
      console.log("[Make.com API] Scenario is not active, skipping stop request");
      return status;
    }
    await makeRequest(`/api/scenarios/${scenarioId}/stop`, { method: "POST" });
    return await getScenarioStatus(scenarioId); // Get fresh status after action
  } catch (error) {
    console.error("[Make.com API] stopScenario failed:", error);
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
    const response = activate
      ? await startScenario(scenarioId)
      : await stopScenario(scenarioId);

    console.log(`[Make.com API] Successfully ${activate ? "started" : "stopped"} scenario:`, response);
    return response;
  } catch (error) {
    console.error(`[Make.com API] Failed to ${activate ? "start" : "stop"} scenario:`, error);
    throw error;
  }
}