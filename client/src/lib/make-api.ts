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
    const action = activate ? 'activate' : 'deactivate';
    const response = await apiRequest('POST', `/api/scenarios/${scenarioId}/${action}`);
    const data = await response.json();
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