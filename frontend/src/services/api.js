const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiCall = async (endpoint, method = 'GET', body = null, getAuthHeaders) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Call Error (${method} ${endpoint}):`, err);
    throw err;
  }
};
