import { z } from "zod";

interface ScenarioStatus {
  status: string;
  message?: string;
  isActive: boolean;
  name: string;
  nextExec?: string;
}

interface MakeApiError {
  detail: string;
  message: string;
  code: string;
  suberrors?: any[];
}

interface MakeApiResponse {
  scenario: {
    id: string;
    name: string;
    isActive: boolean;
    isPaused: boolean;
    nextExec?: string;
    scheduling?: {
      type: string;
      interval: number;
    };
  };
}

// Separate function for Make.com API requests to handle CORS properly
async function makeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const makeApiKey = import.meta.env.VITE_MAKE_API_KEY;
  if (!makeApiKey) {
    throw new Error("Make.com API key not found in environment variables");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Token ${makeApiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    // Don't include credentials for cross-origin requests
    credentials: 'omit',
    mode: 'cors',
  });

  if (!response.ok) {
    const errorData: MakeApiError = await response.json();
    console.error("[Make.com API] Error response:", {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(errorData.message || errorData.detail || "Make.com API request failed");
  }

  return response;
}

export async function toggleScenario(
  scenarioId: string,
  activate: boolean,
): Promise<boolean> {
  try {
    const action = activate ? 'start' : 'stop';
    const baseUrl = "https://us1.make.com/api/v2"; // Using US1 instance
    const url = `${baseUrl}/scenarios/${scenarioId}/${action}`;

    console.log(
      `[Make.com API] Sending ${action} request for scenario ${scenarioId}`,
      '\nRequest URL:', url,
    );

    const response = await makeFetch(url, {
      method: "POST",
    });

    const data: MakeApiResponse = await response.json();
    console.log('[Make.com API] Toggle response:', data);

    return true;
  } catch (error) {
    console.error("[Make.com API] Error during toggle request:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to communicate with Make.com API";
    throw new Error(errorMessage);
  }
}

export async function getScenarioStatus(
  scenarioId: string,
): Promise<ScenarioStatus> {
  try {
    console.log("[Make.com API] Getting status for scenario", scenarioId);
    const baseUrl = "https://us1.make.com/api/v2"; // Using US1 instance
    const url = `${baseUrl}/scenarios/${scenarioId}`;

    console.log("[Make.com API] Request URL:", url);

    const response = await makeFetch(url, {
      method: "GET",
    });

    const data: MakeApiResponse = await response.json();
    console.log("[Make.com API] Raw response:", data);

    if (!data?.scenario) {
      console.error("[Make.com API] Invalid scenario data format:", data);
      throw new Error(
        "Invalid scenario data format received from Make.com API",
      );
    }

    const status: ScenarioStatus = {
      status: data.scenario.isActive ? "active" : "inactive",
      isActive: data.scenario.isActive,
      name: data.scenario.name,
      nextExec: data.scenario.nextExec,
      message: data.scenario.isPaused ? "Scenario is paused" : undefined,
    };

    console.log("[Make.com API] Parsed status:", status);
    return status;
  } catch (error) {
    console.error("[Make.com API] Error getting scenario status:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to communicate with Make.com API";
    throw new Error(errorMessage);
  }
}