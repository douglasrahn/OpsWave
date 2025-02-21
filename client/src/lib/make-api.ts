const MAKE_API_KEY = "b9e11e92-2e1e-4b73-b6b0-c53904ad66bc";
const MAKE_API_BASE_URL = "https://api.make.com/v2";

interface ScenarioStatus {
  status: string;
  message?: string;
}

export async function toggleScenario(scenarioId: string, activate: boolean): Promise<boolean> {
  const endpoint = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}/${activate ? 'activate' : 'deactivate'}`;

  try {
    console.log(`Making API call to ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Make.com API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to ${activate ? 'activate' : 'deactivate'} scenario: ${errorText || response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error toggling scenario:', error);
    throw error;
  }
}

export async function getScenarioStatus(scenarioId: string): Promise<ScenarioStatus> {
  const endpoint = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}`;

  try {
    console.log(`Checking scenario status at ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Make.com API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to get scenario status: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      message: data.statusMessage
    };
  } catch (error) {
    console.error('Error getting scenario status:', error);
    throw error;
  }
}