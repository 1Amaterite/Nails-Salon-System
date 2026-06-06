import { fetchWithTimeout } from './api';
import { getApiUrl, getAuthToken } from './getApiUrl';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

class ApiClient {
  private getHeaders(customHeaders: HeadersInit = {}): HeadersInit {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...customHeaders,
    };
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const API_URL = getApiUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const isJsonBody = options.body && !(options.body instanceof FormData);
    const requestOptions: RequestInit = {
      ...options,
      headers: this.getHeaders(options.headers),
      body: isJsonBody ? JSON.stringify(options.body) : (options.body as BodyInit),
    };

    const response = await fetchWithTimeout(url, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Request failed with status ${response.status}`);
    }

    return response.json();
  }

  public get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
