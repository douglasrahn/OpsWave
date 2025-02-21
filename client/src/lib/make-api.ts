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
    console.log('Current scenario status:', currentStatus);

    // Only proceed if the current status matches our intent to change
    if (currentStatus.isActive === activate) {
      console.log(`Scenario is already ${activate ? 'active' : 'inactive'}`);
      return true;
    }

    const action = activate ? 'activate' : 'deactivate';
    console.log(`Toggling scenario ${scenarioId} to ${action}`);

    try {
      const response = await apiRequest('POST', `/api/scenarios/${scenarioId}/${action}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${action} scenario: ${errorText}`);
      }

      // Verify the toggle was successful by checking the new status
      const updatedStatus = await getScenarioStatus(scenarioId);
      console.log('Updated scenario status:', updatedStatus);

      if (updatedStatus.isActive !== activate) {
        throw new Error(`Failed to ${action} scenario. Status remains ${updatedStatus.status}`);
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error(`Scenario ${scenarioId} not found. Please verify your scenario ID.`);
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
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get scenario status: ${errorText}`);
    }

    const data = await response.json();
    console.log('Get scenario status response:', data);

    if (!data || typeof data !== 'object') {
      console.error('Invalid scenario data format:', data);
      throw new Error('Invalid scenario data format received from Make.com API');
    }

    return {
      status: data.isActive ? 'active' : 'inactive',
      isActive: data.isActive,
      name: data.name,
      nextExec: data.nextExec,
      message: data.message
    };
  } catch (error) {
    console.error('Error getting scenario status:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error(`Scenario ${scenarioId} not found. Please verify your scenario ID.`);
    }
    throw error;
  }
}