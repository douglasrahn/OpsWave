// Get Make.com API key from environment variables
const MAKE_API_KEY = import.meta.env.VITE_MAKE_API_KEY;
const MAKE_API_BASE_URL = "https://eu1.make.com/api/v2";

interface ScenarioStatus {
  status: string;
  message?: string;
}

interface MakeApiError {
  detail: string;
  message: string;
  code: string;
  suberrors?: any[];
}

export async function toggleScenario(scenarioId: string, activate: boolean): Promise<boolean> {
  if (!MAKE_API_KEY) {
    throw new Error("Make.com API key is not configured");
  }

  const endpoint = `${MAKE_API_BASE_URL}/scenarios/${scenarioId}/${activate ? 'activate' : 'deactivate'}`;

  try {
    console.log(`Making API call to ${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });

    const responseText = await response.text();
    console.log('Make.com API Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText || '(empty response)'
    });

    if (!response.ok) {
      console.error('Make.com API Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText || '(empty response)'
      });

      let errorMessage = `Failed to ${activate ? 'activate' : 'deactivate'} scenario`;
      try {
        const errorData = JSON.parse(responseText) as MakeApiError;
        if (errorData.code === 'SC401') {
          throw new Error('Invalid or expired API token. Please check your Make.com API token configuration.');
        }
        errorMessage = `${errorMessage}: ${errorData.message || errorData.detail || response.statusText}`;
        if (errorData.suberrors?.length) {
          console.error('Detailed errors:', errorData.suberrors);
        }
      } catch (parseError) {
        errorMessage = `${errorMessage}: ${responseText || response.statusText}`;
      }

      throw new Error(errorMessage);
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
    console.log(`Checking scenario status at ${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${MAKE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });

    const responseText = await response.text();
    console.log('Make.com API Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText || '(empty response)'
    });

    if (!response.ok) {
      console.error('Make.com API Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText || '(empty response)'
      });

      let errorMessage = 'Failed to get scenario status';
      try {
        const errorData = JSON.parse(responseText) as MakeApiError;
        if (errorData.code === 'SC401') {
          throw new Error('Invalid or expired API token. Please check your Make.com API token configuration.');
        }
        errorMessage = `${errorMessage}: ${errorData.message || errorData.detail || response.statusText}`;
        if (errorData.suberrors?.length) {
          console.error('Detailed errors:', errorData.suberrors);
        }
      } catch (parseError) {
        errorMessage = `${errorMessage}: ${responseText || response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed scenario data:', data);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Invalid response format from Make.com API');
    }

    if (!data || typeof data.status !== 'string') {
      console.error('Invalid scenario data format:', data);
      throw new Error('Invalid scenario data format received from Make.com API');
    }

    return {
      status: data.status,
      message: data.statusMessage || data.message
    };
  } catch (error) {
    console.error('Error getting scenario status:', error);
    throw error;
  }
}