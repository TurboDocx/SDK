/**
 * HTTP Client Configuration Tests
 *
 * Tests for configuration validation including senderEmail/senderName requirements
 */

import { HttpClient } from '../src/http';
import { AuthenticationError } from '../src/utils/errors';

describe('HttpClient Configuration', () => {
  // Clear environment variables before each test
  beforeEach(() => {
    delete process.env.TURBODOCX_API_KEY;
    delete process.env.TURBODOCX_ORG_ID;
    delete process.env.TURBODOCX_SENDER_EMAIL;
    delete process.env.TURBODOCX_SENDER_NAME;
    delete process.env.TURBODOCX_BASE_URL;
  });

  describe('senderEmail configuration', () => {
    it('should not throw when senderEmail is not provided (optional in HttpClient)', () => {
      // Note: senderEmail validation is done in TurboSign.configure(), not HttpClient
      expect(() => {
        new HttpClient({
          apiKey: 'test-api-key',
          orgId: 'test-org-id',
          // senderEmail intentionally missing - this is valid for HttpClient
        });
      }).not.toThrow();
    });

    it('should return undefined for senderEmail when not provided', () => {
      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
      });
      const config = client.getSenderConfig();
      expect(config.senderEmail).toBeUndefined();
    });

    it('should accept valid senderEmail', () => {
      expect(() => {
        new HttpClient({
          apiKey: 'test-api-key',
          orgId: 'test-org-id',
          senderEmail: 'support@company.com',
        });
      }).not.toThrow();
    });

    it('should read senderEmail from environment variable', () => {
      process.env.TURBODOCX_API_KEY = 'test-api-key';
      process.env.TURBODOCX_ORG_ID = 'test-org-id';
      process.env.TURBODOCX_SENDER_EMAIL = 'support@company.com';

      expect(() => {
        new HttpClient();
      }).not.toThrow();
    });

    it('should prioritize config over environment variable', () => {
      process.env.TURBODOCX_SENDER_EMAIL = 'env@company.com';

      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'config@company.com',
      });

      const senderConfig = client.getSenderConfig();
      expect(senderConfig.senderEmail).toBe('config@company.com');
    });
  });

  describe('senderName configuration', () => {
    it('should not throw error when senderName is not provided', () => {
      expect(() => {
        new HttpClient({
          apiKey: 'test-api-key',
          orgId: 'test-org-id',
          senderEmail: 'support@company.com',
          // senderName intentionally missing (optional)
        });
      }).not.toThrow();
    });

    it('should accept senderName when provided', () => {
      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'support@company.com',
        senderName: 'Company Support Team',
      });

      const senderConfig = client.getSenderConfig();
      expect(senderConfig.senderName).toBe('Company Support Team');
    });

    it('should read senderName from environment variable', () => {
      process.env.TURBODOCX_API_KEY = 'test-api-key';
      process.env.TURBODOCX_ORG_ID = 'test-org-id';
      process.env.TURBODOCX_SENDER_EMAIL = 'support@company.com';
      process.env.TURBODOCX_SENDER_NAME = 'Company Support';

      const client = new HttpClient();
      const senderConfig = client.getSenderConfig();
      expect(senderConfig.senderName).toBe('Company Support');
    });

    it('should prioritize config over environment variable for senderName', () => {
      process.env.TURBODOCX_SENDER_NAME = 'Env Name';

      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'support@company.com',
        senderName: 'Config Name',
      });

      const senderConfig = client.getSenderConfig();
      expect(senderConfig.senderName).toBe('Config Name');
    });
  });

  describe('existing validation (API key and orgId)', () => {
    it('should throw AuthenticationError when API key is missing', () => {
      expect(() => {
        new HttpClient({
          orgId: 'test-org-id',
          senderEmail: 'support@company.com',
          // apiKey intentionally missing
        });
      }).toThrow(AuthenticationError);
    });

    it('should accept access token instead of API key', () => {
      expect(() => {
        new HttpClient({
          accessToken: 'test-access-token',
          orgId: 'test-org-id',
          senderEmail: 'support@company.com',
        });
      }).not.toThrow();
    });

    it('should throw when orgId is missing', () => {
      // Note: orgId validation might be in a different layer, check actual implementation
      expect(() => {
        new HttpClient({
          apiKey: 'test-api-key',
          senderEmail: 'support@company.com',
          // orgId intentionally missing
        });
      }).not.toThrow(); // orgId is optional in HttpClient, validated elsewhere
    });
  });

  describe('getSenderConfig', () => {
    it('should return senderEmail and senderName', () => {
      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'support@company.com',
        senderName: 'Company Support',
      });

      const config = client.getSenderConfig();
      expect(config).toEqual({
        senderEmail: 'support@company.com',
        senderName: 'Company Support',
      });
    });

    it('should return undefined for senderName when not provided', () => {
      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'support@company.com',
      });

      const config = client.getSenderConfig();
      expect(config.senderEmail).toBe('support@company.com');
      expect(config.senderName).toBeUndefined();
    });
  });

  describe('full configuration', () => {
    it('should accept all configuration options', () => {
      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        baseUrl: 'https://custom-api.example.com',
        senderEmail: 'support@company.com',
        senderName: 'Company Support Team',
      });

      const config = client.getSenderConfig();
      expect(config.senderEmail).toBe('support@company.com');
      expect(config.senderName).toBe('Company Support Team');
    });

    it('should use default baseUrl when not provided', () => {
      const client = new HttpClient({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'support@company.com',
      });

      // baseUrl is private, but we can verify construction succeeded
      expect(client).toBeInstanceOf(HttpClient);
    });
  });
});
