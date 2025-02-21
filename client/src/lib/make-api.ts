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

    // Only proceed if the current status matches our intent to change
    if (currentStatus.isActive === activate) {
      console.log(`Scenario is already ${activate ? 'active' : 'inactive'}`);
      return true;
    }

    const action = activate ? 'activate' : 'deactivate';
    console.log(`Toggling scenario ${scenarioId} to ${action}`);

    const response = await apiRequest('POST', `/api/scenarios/${scenarioId}/${action}`);
    const data: MakeApiResponse = await response.json();

    // Log the parsed response for debugging
    console.log('Toggle scenario response:', data);

    // Verify the toggle was successful
    const updatedStatus = await getScenarioStatus(scenarioId);
    if (updatedStatus.isActive !== activate) {
      throw new Error(`Failed to ${action} scenario. Status remains ${updatedStatus.status}`);
    }

    return true;
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
    throw error;
  }
}