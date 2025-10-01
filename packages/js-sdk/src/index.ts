/**
 * TurboDocx JavaScript SDK
 *
 * Official SDK for TurboDocx API
 */

export class TurboDocxClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.turbodocx.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Placeholder method - will be generated from OpenAPI specs
   */
  async getStatus(): Promise<{ status: string }> {
    // Implementation will be generated from API specs
    return { status: 'ok' };
  }
}

export default TurboDocxClient;
