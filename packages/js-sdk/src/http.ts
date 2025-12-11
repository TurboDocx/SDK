/**
 * HTTP client for TurboDocx API
 */

import * as fs from 'fs';
import * as nodePath from 'path';
import { TurboDocxError, AuthenticationError, ValidationError, NotFoundError, RateLimitError, NetworkError } from './utils/errors';

export interface HttpClientConfig {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  orgId?: string;
}

/**
 * Detect file type from buffer content using magic bytes
 * - PDF: starts with %PDF (0x25 0x50 0x44 0x46)
 * - DOCX/PPTX: starts with PK (ZIP), differentiate by internal content
 */
const detectFileType = (buffer: Buffer): { mimetype: string; extension: string } => {
  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mimetype: 'application/pdf', extension: 'pdf' };
  }

  // ZIP-based formats (DOCX, PPTX): starts with PK (0x50 0x4B)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    // Convert buffer to string to search for internal markers
    const bufferStr = buffer.toString('utf8', 0, Math.min(buffer.length, 2000));

    // PPTX contains 'ppt/' in the ZIP structure
    if (bufferStr.includes('ppt/')) {
      return {
        mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        extension: 'pptx'
      };
    }

    // DOCX contains 'word/' in the ZIP structure
    if (bufferStr.includes('word/')) {
      return {
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx'
      };
    }

    // Default to DOCX if it's a ZIP but can't determine type
    return {
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx'
    };
  }

  // Unknown file type
  return { mimetype: 'application/octet-stream', extension: 'bin' };
};

export class HttpClient {
  private apiKey?: string;
  private accessToken?: string;
  private baseUrl: string;
  private orgId?: string;

  constructor(config: HttpClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.TURBODOCX_API_KEY;
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com';
    this.orgId = config.orgId || process.env.TURBODOCX_ORG_ID;

    if (!this.apiKey && !this.accessToken) {
      throw new AuthenticationError('API key or access token is required');
    }
  }

  /**
   * Smart unwrap response data.
   * If response has ONLY "data" key, extract it.
   * This handles backend responses that wrap data in { "data": { ... } }
   */
  private smartUnwrap<T>(data: any): T {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      if (keys.length === 1 && keys[0] === 'data') {
        return data.data as T;
      }
    }
    return data as T;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // API key is sent as Bearer token (backend expects Authorization header)
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Organization ID header (required by backend)
    if (this.orgId) {
      headers['x-rapiddocx-org-id'] = this.orgId;
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
        const jsonData = await response.json();
        return this.smartUnwrap<T>(jsonData);
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
    apiPath: string,
    file: string | File | Buffer,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseUrl}${apiPath}`;
    const formData = new FormData();

    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (typeof file === 'string') {
      // File path: read file and detect type from content
      fileBuffer = fs.readFileSync(file);
      const detected = detectFileType(fileBuffer);
      fileName = nodePath.basename(file);
      mimeType = detected.mimetype;
    } else if (file instanceof Buffer) {
      // Buffer: detect type from content
      fileBuffer = file;
      const detected = detectFileType(fileBuffer);
      fileName = additionalData?.fileName || `document.${detected.extension}`;
      mimeType = detected.mimetype;
    } else {
      // Browser File object: use native properties
      const browserFile = file as File;
      formData.append(fieldName, browserFile, browserFile.name);

      // Add additional form fields
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          if (key === 'fileName') return;
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        });
      }

      // Make request for browser File
      const headers: Record<string, string> = {};
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      } else if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      if (this.orgId) {
        headers['x-rapiddocx-org-id'] = this.orgId;
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

        const jsonData = await response.json();
        return this.smartUnwrap<T>(jsonData);
      } catch (error) {
        if (error instanceof TurboDocxError) {
          throw error;
        }
        throw new NetworkError(`File upload failed: ${error}`);
      }
    }

    // Create blob with detected mimetype and append with filename
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append(fieldName, blob, fileName);

    // Add additional form fields (except fileName which is only used for file metadata)
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (key === 'fileName') return; // Skip fileName - it's used for file blob, not as form field
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      });
    }

    const headers: Record<string, string> = {};
    // API key is sent as Bearer token (backend expects Authorization header)
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    // Organization ID header (required by backend)
    if (this.orgId) {
      headers['x-rapiddocx-org-id'] = this.orgId;
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

      const jsonData = await response.json();
      return this.smartUnwrap<T>(jsonData);
    } catch (error) {
      if (error instanceof TurboDocxError) {
        throw error;
      }
      throw new NetworkError(`File upload failed: ${error}`);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json() as { message?: string; error?: string; code?: string };
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
    }

    if (response.status === 400) {
      throw new ValidationError(errorMessage);
    }
    if (response.status === 401) {
      throw new AuthenticationError(errorMessage);
    }
    if (response.status === 404) {
      throw new NotFoundError(errorMessage);
    }
    if (response.status === 429) {
      throw new RateLimitError(errorMessage);
    }

    throw new TurboDocxError(errorMessage, response.status);
  }

  async get<T>(path: string, params?: Record<string, any>, options?: RequestInit): Promise<T> {
    let url = path;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', path, data, options);
  }
}
