/**
 * HTTP client for TurboDocx API
 */

import * as fs from 'fs';
import * as nodePath from 'path';
import { TurboDocxError, AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, RateLimitError, NetworkError } from './utils/errors';
import { normalizeResponse } from './utils/response-normalizer';
import { ClientContext, resolveClientContextHeaders } from './utils/client-context';

/**
 * Configuration for the TurboDocx HTTP client
 *
 * @property apiKey - TurboDocx API key (required)
 * @property orgId - Organization ID (required)
 * @property senderEmail - Reply-to email address for signature requests (required for TurboSign). Used as the reply-to address on signature request emails and recorded as the sender in the audit trail. An API key has no mailbox of its own, so the API rejects a send without it rather than mailing from an unmonitored address.
 * @property senderName - Sender name for signature requests (optional). Appears in signature request emails and the audit trail. Defaults to the name of your API key.
 * @property accessToken - OAuth access token (alternative to apiKey)
 * @property baseUrl - API base URL (optional, defaults to https://api.turbodocx.com)
 * @property skipSenderValidation - Skip senderEmail validation (used internally by TurboPartner)
 */
export interface HttpClientConfig {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  orgId?: string;
  senderEmail?: string;
  senderName?: string;
  skipSenderValidation?: boolean;
  /**
   * Describes the calling environment for the signature audit trail. The SDK
   * auto-detects a descriptive User-Agent, timezone, and device fingerprint
   * from the host; supply this to override them or to report a client IP
   * (`ipAddress`) so the audit trail can geolocate the caller. See
   * {@link ClientContext}.
   */
  clientContext?: ClientContext;
}

/**
 * Configuration for the TurboPartner HTTP client
 *
 * @property partnerApiKey - Partner API key (must start with TDXP-)
 * @property partnerId - Partner ID (UUID format)
 * @property baseUrl - API base URL (optional, defaults to https://api.turbodocx.com)
 */
export interface PartnerClientConfig {
  partnerApiKey: string;
  partnerId: string;
  baseUrl?: string;
}

/**
 * Configuration for the TurboQuote HTTP client
 */
export interface QuoteClientConfig {
  apiKey?: string;
  accessToken?: string;
  orgId?: string;
  baseUrl?: string;
}

/**
 * Detect file type from buffer content using magic bytes
 * - PDF: starts with %PDF (0x25 0x50 0x44 0x46)
 * - DOCX/PPTX: starts with PK (ZIP), differentiate by internal content
 */
/**
 * Re-view a Buffer's bytes as an ArrayBuffer-backed Uint8Array so it can be passed to `new Blob()`.
 *
 * ponytail: @types/node 26 types Buffer as ArrayBufferLike-backed, which is not a valid BlobPart —
 * BlobPart requires an ArrayBuffer-backed view, because the underlying buffer could in principle be
 * a SharedArrayBuffer. This is zero-copy (a view over the same memory, not a duplicate), so upload
 * memory is unchanged, and fs.readFileSync never returns a SharedArrayBuffer-backed Buffer.
 *
 * Spelled `Uint8Array<ArrayBuffer>` rather than `BlobPart` because BlobPart is not in scope
 * under ts-jest's resolution — the generic is the only form that satisfies both `tsc -p` and
 * the test run. It surfaces in http.d.ts but not the package entry point.
 */
export const toBlobPart = (buffer: Buffer): Uint8Array<ArrayBuffer> =>
  new Uint8Array(buffer.buffer as ArrayBuffer, buffer.byteOffset, buffer.byteLength);

export const detectFileType = (buffer: Buffer): { mimetype: string; extension: string } => {
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

  // JPEG: starts with 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mimetype: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: starts with 0x89 0x50 0x4E 0x47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { mimetype: 'image/png', extension: 'png' };
  }

  // GIF: starts with GIF87a or GIF89a (0x47 0x49 0x46)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mimetype: 'image/gif', extension: 'gif' };
  }

  // WEBP: starts with RIFF....WEBP (0x52 0x49 0x46 0x46 .... 0x57 0x45 0x42 0x50)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { mimetype: 'image/webp', extension: 'webp' };
  }

  // Unknown file type
  return { mimetype: 'application/octet-stream', extension: 'bin' };
};

export class HttpClient {
  private apiKey?: string;
  private accessToken?: string;
  private baseUrl: string;
  private orgId?: string;
  private senderEmail?: string;
  private senderName?: string;
  /** Resolved client-context headers (User-Agent, X-Timezone, ...), computed once. */
  private contextHeaders: Record<string, string>;

  constructor(config: HttpClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.TURBODOCX_API_KEY;
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com';
    this.orgId = config.orgId || process.env.TURBODOCX_ORG_ID;
    this.senderEmail = config.senderEmail || process.env.TURBODOCX_SENDER_EMAIL;
    this.senderName = config.senderName || process.env.TURBODOCX_SENDER_NAME;
    this.contextHeaders = resolveClientContextHeaders(config.clientContext);

    if (!this.apiKey && !this.accessToken) {
      throw new AuthenticationError('API key or access token is required');
    }

    if (!this.senderEmail && !config.skipSenderValidation) {
      throw new ValidationError('senderEmail is required. It is used as the reply-to address for signature requests and recorded as the sender in the audit trail. The API rejects sends without it.');
    }
  }

  /**
   * Get sender email and name configuration
   */
  getSenderConfig(): { senderEmail?: string; senderName?: string } {
    return {
      senderEmail: this.senderEmail,
      senderName: this.senderName,
    };
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
    // Client-context headers (User-Agent, X-Timezone, X-Forwarded-For,
    // X-Device-Fingerprint) describe the calling environment so the signature
    // audit trail records real device/location instead of "node"/"Unknown".
    // Spread them first so the SDK's own protocol headers (Content-Type,
    // Authorization, org id) always win over caller-supplied context.
    const headers: Record<string, string> = {
      ...this.contextHeaders,
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

  /**
   * Headers for multipart/form-data requests: same as {@link getHeaders} but
   * without `Content-Type` so `fetch` can set the multipart boundary itself.
   */
  private getMultipartHeaders(): Record<string, string> {
    const headers = this.getHeaders();
    delete headers['Content-Type'];
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
        return normalizeResponse(this.smartUnwrap<T>(jsonData));
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
      const headers = this.getMultipartHeaders();

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
        return normalizeResponse(this.smartUnwrap<T>(jsonData));
      } catch (error) {
        if (error instanceof TurboDocxError) {
          throw error;
        }
        throw new NetworkError(`File upload failed: ${error}`);
      }
    }

    // Create blob with detected mimetype and append with filename
    const blob = new Blob([toBlobPart(fileBuffer)], { type: mimeType });
    formData.append(fieldName, blob, fileName);

    // Add additional form fields (except fileName which is only used for file metadata)
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (key === 'fileName') return; // Skip fileName - it's used for file blob, not as form field
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      });
    }

    const headers = this.getMultipartHeaders();

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
      return normalizeResponse(this.smartUnwrap<T>(jsonData));
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
      // The API reports failures in a few shapes; read all of them so the caller always gets
      // the actionable reason rather than a generic envelope (or "[object Object]").
      const errorData = (await response.json()) as {
        message?: string;
        // May be a plain string OR a nested object — the TurboQuote surface returns
        // `{ error: { message, code } }`, which stringifies to "[object Object]" if treated
        // as a string.
        error?: string | { message?: string; code?: string };
        code?: string;
        // Several handlers report the machine-readable reason as `type` rather than `code`.
        type?: string;
        // Field-level validation reasons: nested for celebrate/Joi, top-level for bulk.
        data?: { errors?: Array<{ message?: string }> };
        errors?: Array<{ message?: string }>;
      };

      // Per-field/per-row reasons are the most useful thing we can report ("senderEmail must
      // be a valid email address", "Row 3: name is required") — the envelope message is
      // generic ("There was an issue validating the body") and doesn't say what to fix.
      const fieldErrors = (errorData.data?.errors ?? errorData.errors ?? [])
        .map((detail) => detail?.message)
        .filter((message): message is string => Boolean(message));

      const nestedError = typeof errorData.error === 'object' && errorData.error !== null ? errorData.error : null;
      const errorString = typeof errorData.error === 'string' ? errorData.error : undefined;

      errorMessage =
        (fieldErrors.length > 0 ? fieldErrors.join('; ') : '') ||
        errorData.message ||
        nestedError?.message ||
        errorString ||
        errorMessage;

      // The specific reason code, so callers can branch on it (err.code === 'QUOTE_NOT_FOUND')
      // rather than only on the HTTP class. It appears in four places depending on the handler:
      //   `code`  · `type`  · nested `error.code`  · `error` as a bare string alongside `message`
      // That last case is why the string form is only treated as a code when `message` is also
      // present — when it stands alone it IS the message (already consumed above).
      errorCode =
        errorData.code ||
        errorData.type ||
        nestedError?.code ||
        (errorData.message && errorString ? errorString : undefined);
    } catch {
      // If response is not JSON, use status text
    }

    if (response.status === 400) {
      throw new ValidationError(errorMessage, errorCode);
    }
    if (response.status === 401) {
      throw new AuthenticationError(errorMessage, errorCode);
    }
    if (response.status === 403) {
      throw new AuthorizationError(errorMessage, errorCode);
    }
    if (response.status === 404) {
      throw new NotFoundError(errorMessage, errorCode);
    }
    if (response.status === 409) {
      throw new ConflictError(errorMessage, errorCode);
    }
    if (response.status === 429) {
      throw new RateLimitError(errorMessage, errorCode);
    }

    throw new TurboDocxError(errorMessage, response.status, errorCode);
  }

  async get<T>(path: string, params?: Record<string, any>, options?: RequestInit): Promise<T> {
    let url = path;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const item of value) {
              searchParams.append(key, String(item));
            }
          } else {
            searchParams.append(key, String(value));
          }
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

  /**
   * Send a PATCH request.
   *
   * Null semantics: properties explicitly set to `null` in the `data` object
   * **are** included in the JSON body (used to clear nullable fields on the
   * server, e.g. `priceBookId`, `validUntil`, `taxRate`). Properties that are
   * `undefined` are omitted by `JSON.stringify` and therefore not sent, which
   * means "leave the current value unchanged."
   */
  async patch<T>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', path, data, options);
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /**
   * Perform a GET request and return raw binary response (for file downloads).
   * Returns ArrayBuffer which can be converted to Buffer (Node) or Blob (browser).
   */
  async getRaw(path: string, params?: Record<string, any>): Promise<ArrayBuffer> {
    let url = path;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const item of value) {
              searchParams.append(key, String(item));
            }
          } else {
            searchParams.append(key, String(value));
          }
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }

    const fullUrl = `${this.baseUrl}${url}`;
    const headers = this.getMultipartHeaders();

    try {
      const response = await fetch(fullUrl, { method: 'GET', headers });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      return response.arrayBuffer();
    } catch (error) {
      if (error instanceof TurboDocxError) {
        throw error;
      }
      throw new NetworkError(`Network request failed: ${error}`);
    }
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    return this.requestFormData<T>('POST', path, formData);
  }

  async patchFormData<T>(path: string, formData: FormData): Promise<T> {
    return this.requestFormData<T>('PATCH', path, formData);
  }

  private async requestFormData<T>(method: string, path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getMultipartHeaders();

    try {
      const response = await fetch(url, { method, headers, body: formData });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      const jsonData = await response.json();
      return normalizeResponse(this.smartUnwrap<T>(jsonData));
    } catch (error) {
      if (error instanceof TurboDocxError) {
        throw error;
      }
      throw new NetworkError(`Form data request failed: ${error}`);
    }
  }
}
