import { ApiResponse } from './types';
import { getApiUrl } from '../urls';

// Базовый URL для бэкенда (пробрасывается через Next.js rewrites)
export const API_URL = getApiUrl();
export const AUTH_URL = getApiUrl();

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Получаем токен из localStorage (если есть)
    // Gateway принимает токен как из cookie, так и из Authorization заголовка
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && token !== 'authenticated') {
        // Добавляем Authorization только если есть реальный токен
        // Если token === 'authenticated', значит используется cookie
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response, endpoint?: string): Promise<ApiResponse<T>> {
    try {
      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: 'Invalid JSON response',
          status: response.status,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: result.error || result.message || `API Error: ${response.statusText}`,
          status: response.status,
          merge_required: result.merge_required,
        };
      }

      return {
        success: true,
        data: result.data !== undefined ? result.data : result,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private normalizeEndpoint(endpoint: string): string {
    // Убираем префикс /api/ чтобы избежать двойного /api/ когда baseUrl = /main/api
    return endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const url = `${this.baseUrl}${normalizedEndpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies
        cache: 'no-store',
      });

      return this.handleResponse<T>(response, endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      let finalHeaders: HeadersInit = await this.getHeaders();
      let finalBody: BodyInit;

      if (typeof window !== 'undefined' && body instanceof FormData) {
        finalBody = body;
        // Remove Content-Type so browser sets correct multipart/form-data boundary
        const headersObj = new Headers(finalHeaders);
        headersObj.delete('Content-Type');
        finalHeaders = Object.fromEntries(headersObj.entries());
      } else {
        finalBody = JSON.stringify(body);
      }

      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const url = `${this.baseUrl}${normalizedEndpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: finalHeaders,
        credentials: 'include',
        body: finalBody,
      });

      return this.handleResponse<T>(response, endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      let finalHeaders: HeadersInit = await this.getHeaders();
      let finalBody: BodyInit;

      if (typeof window !== 'undefined' && body instanceof FormData) {
        finalBody = body;
        const headersObj = new Headers(finalHeaders);
        headersObj.delete('Content-Type');
        finalHeaders = Object.fromEntries(headersObj.entries());
      } else {
        finalBody = JSON.stringify(body);
      }

      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const response = await fetch(`${this.baseUrl}${normalizedEndpoint}`, {
        method: 'PUT',
        headers: finalHeaders,
        credentials: 'include', // Include cookies
        body: finalBody,
      });

      return this.handleResponse<T>(response, endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const options: RequestInit = {
        method: 'DELETE',
        headers,
        credentials: 'include', // Include cookies
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const response = await fetch(`${this.baseUrl}${normalizedEndpoint}`, options);

      return this.handleResponse<T>(response, endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const apiClient = new ApiClient(API_URL);
export const authClient = new ApiClient(AUTH_URL);
