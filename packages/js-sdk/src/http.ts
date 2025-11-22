/**
 * HTTP client for TurboDocx API
 */

import { TurboDocxError, AuthenticationError, NetworkError } from './utils/errors';

export interface HttpClientConfig {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
}

export class HttpClient {
  private apiKey?: string;
  private accessToken?: string;
  private baseUrl: string;

  constructor(config: HttpClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.TURBODOCX_API_KEY;
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com';

    if (!this.apiKey && !this.accessToken) {
      throw new AuthenticationError('API key or access token is required');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...this.getHeaders(), ...options.headers };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      }

      return response as any;
    } catch (error) {
      if (error instanceof TurboDocxError) {
        throw error;
      }
      throw new NetworkError(`Network request failed: ${error}`);
    }
  }

  async uploadFile<T>(
    path: string,
    file: File | Buffer,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const formData = new FormData();

    // Add file to form data
    if (file instanceof Buffer) {
      const blob = new Blob([file]);
      formData.append(fieldName, blob);
    } else {
      formData.append(fieldName, file);
    }

    // Add additional form fields
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      });
    }

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof TurboDocxError) {
        throw error;
      }
      throw new NetworkError(`File upload failed: ${error}`);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json() as { message?: string; error?: string; code?: string };
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorCode = errorData.code;
    } catch {
      // If response is not JSON, use status text
    }

    if (response.status === 401) {
      throw new AuthenticationError(errorMessage);
    }

    throw new TurboDocxError(errorMessage, response.status, errorCode);
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', path, data, options);
  }

  async patch<T>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', path, data, options);
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}
