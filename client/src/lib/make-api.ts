// Get Make.com API key from environment variables
const MAKE_API_KEY = import.meta.env.VITE_MAKE_API_KEY;
const MAKE_API_BASE_URL = "https://api.make.com/v2";

interface ScenarioStatus {
  status: string;
  message?: string;
}

export async function toggleScenario(scenarioId: string, activate: boolean): Promise<boolean> {
  if (!MAKE_API_KEY) {
    throw new Error("Make.com API key is not configured");
  }

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

    const responseText = await response.text();
    console.log('Make.com API Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      console.error('Make.com API Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText
      });
      throw new Error(`Failed to ${activate ? 'activate' : 'deactivate'} scenario: ${responseText || response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error toggling scenario:', error);
    throw error;
  }
}

export async function getScenarioStatus(scenarioId: string): Promise<ScenarioStatus> {
  if (!MAKE_API_KEY) {
    throw new Error("Make.com API key is not configured");
  }

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

    const responseText = await response.text();
    console.log('Make.com API Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      console.error('Make.com API Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText
      });
      throw new Error(`Failed to get scenario status: ${responseText || response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Invalid response format from Make.com API');
    }

    return {
      status: data.status,
      message: data.statusMessage
    };
  } catch (error) {
    console.error('Error getting scenario status:', error);
    throw error;
  }
}