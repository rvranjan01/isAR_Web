const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL && !import.meta.env.VITE_USE_MOCK_API) {
  console.warn("VITE_API_BASE_URL is not defined in environment variables");
}

export const isMockMode = (): boolean => {
  const envMock = import.meta.env.VITE_USE_MOCK_API;
  return envMock === true || envMock === 'true' || envMock === undefined;
};

export async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('immverse_auth_token');

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network request failed' }));
    throw new Error(errorData.message || `HTTP ${response.status} Error`);
  }

  return response.json() as Promise<T>;
}
