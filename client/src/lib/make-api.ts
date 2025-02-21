import { apiRequest } from "./queryClient";

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

export async function toggleScenario(scenarioId: string, activate: boolean): Promise<boolean> {
  try {
    // First get the current status to verify the intended action
    const currentStatus = await getScenarioStatus(scenarioId);
    console.log('[Make.com API] Current scenario status before toggle:', currentStatus);

    // Check if the scenario is in a valid state for toggling
    if (currentStatus.status === 'error') {
      throw new Error('Cannot toggle scenario: Current status is invalid');
    }

    // Only proceed if the current status actually needs to change
    if (currentStatus.isActive === activate) {
      console.log(`[Make.com API] Scenario is already ${activate ? 'active' : 'inactive'}`);
      return true;
    }

    const action = activate ? 'activate' : 'deactivate';
    console.log(`[Make.com API] Sending ${action} request for scenario ${scenarioId}`);

    try {
      const response = await apiRequest('POST', `/api/scenarios/${scenarioId}/${action}`, {
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[Make.com API] Toggle request failed:', errorData);
        throw new Error(`Failed to ${action} scenario: ${errorData.message || 'Unknown error'}`);
      }

      const data: MakeApiResponse = await response.json();
      console.log('[Make.com API] Toggle response:', data);

      // Add delay before checking status if we're deactivating
      if (!activate) {
        console.log('[Make.com API] Waiting 5 seconds before checking deactivated status...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Verify the toggle was successful by checking the updated status
      const updatedStatus = await getScenarioStatus(scenarioId);
      console.log('[Make.com API] Status after toggle:', updatedStatus);

      // Ensure the status matches our intended state
      if (updatedStatus.isActive !== activate) {
        throw new Error(`Failed to ${action} scenario. Status remains ${updatedStatus.status}`);
      }

      return true;
    } catch (error) {
      console.log('[Make.com API] Error during toggle request:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error(`Scenario ${scenarioId} not found. Please verify your scenario ID.`);
        }
        throw new Error(`Failed to ${action} scenario: ${error.message}`);
      }
      throw error;
    }
  } catch (error) {
    console.error('[Make.com API] Error in toggle scenario:', error);
    throw error;
  }
}

export async function getScenarioStatus(scenarioId: string): Promise<ScenarioStatus> {
  try {
    console.log('[Make.com API] Getting status for scenario', scenarioId);
    const response = await apiRequest('GET', `/api/scenarios/${scenarioId}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('[Make.com API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: await response.text()
      });
      throw new Error(errorData.message || 'Failed to get scenario status');
    }

    const data: MakeApiResponse = await response.json();
    console.log('[Make.com API] Raw response:', data);

    if (!data?.scenario) {
      console.error('[Make.com API] Invalid scenario data format:', data);
      throw new Error('Invalid scenario data format received from Make.com API');
    }

    const status = {
      status: data.scenario.isActive ? 'active' : 'inactive',
      isActive: data.scenario.isActive,
      name: data.scenario.name,
      nextExec: data.scenario.nextExec,
      message: data.scenario.isPaused ? 'Scenario is paused' : undefined
    };

    console.log('[Make.com API] Parsed status:', status);
    return status;
  } catch (error) {
    console.error('[Make.com API] Error getting scenario status:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error(`Scenario ${scenarioId} not found. Please verify your scenario ID.`);
    }
    throw error;
  }
}