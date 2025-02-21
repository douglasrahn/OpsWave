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

    // Check if the scenario is in a valid state for toggling
    if (currentStatus.status === 'error') {
      throw new Error('Cannot toggle scenario: Current status is invalid');
    }

    // Only proceed if the current status actually needs to change
    if (currentStatus.isActive === activate) {
      console.log(`Scenario is already ${activate ? 'active' : 'inactive'}`);
      return true;
    }

    const action = activate ? 'activate' : 'deactivate';
    console.log(`Toggling scenario ${scenarioId} to ${action}`);

    try {
      const response = await apiRequest('POST', `/api/scenarios/${scenarioId}/${action}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to ${action} scenario: ${errorData.message || 'Unknown error'}`);
      }

      const data: MakeApiResponse = await response.json();
      console.log('Toggle scenario response:', data);

      // Verify the toggle was successful by checking the updated status
      const updatedStatus = await getScenarioStatus(scenarioId);

      // Ensure the status matches our intended state
      if (updatedStatus.isActive !== activate) {
        throw new Error(`Failed to ${action} scenario. Status remains ${updatedStatus.status}`);
      }

      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error(`Scenario ${scenarioId} not found. Please verify your scenario ID.`);
        }
        throw new Error(`Failed to ${action} scenario: ${error.message}`);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error toggling scenario:', error);
    throw error;
  }
}

export async function getScenarioStatus(scenarioId: string): Promise<ScenarioStatus> {
  try {
    const response = await apiRequest('GET', `/api/scenarios/${scenarioId}`);
    const data: MakeApiResponse = await response.json();

    // Log the parsed response for debugging
    console.log('Get scenario status response:', data);

    if (!data?.scenario) {
      console.error('Invalid scenario data format:', data);
      throw new Error('Invalid scenario data format received from Make.com API');
    }

    return {
      status: data.scenario.isActive ? 'active' : 'inactive',
      isActive: data.scenario.isActive,
      name: data.scenario.name,
      nextExec: data.scenario.nextExec,
      message: data.scenario.isPaused ? 'Scenario is paused' : undefined
    };
  } catch (error) {
    console.error('Error getting scenario status:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error(`Scenario ${scenarioId} not found. Please verify your scenario ID.`);
    }
    throw error;
  }
}