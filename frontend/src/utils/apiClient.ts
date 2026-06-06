import { fetchWithTimeout } from './api';
import { getApiUrl } from './getApiUrl';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

class ApiClient {
  private getHeaders(customHeaders: HeadersInit = {}, skipAuth = false): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return {
      ...headers,
      ...customHeaders,
    };
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const API_URL = getApiUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const isJsonBody = options.body && !(options.body instanceof FormData);
    const headers = this.getHeaders(options.headers, options.skipAuth);

    if (!isJsonBody) {
      if (headers instanceof Headers) {
        headers.delete('Content-Type');
      } else if (typeof headers === 'object' && !Array.isArray(headers)) {
        delete (headers as Record<string, string>)['Content-Type'];
      }
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      body: isJsonBody ? JSON.stringify(options.body) : (options.body as BodyInit),
    };

    const response = await fetchWithTimeout(url, requestOptions);

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('ownerToken');
        window.dispatchEvent(new Event('unauthorized-api-call'));
      }
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
