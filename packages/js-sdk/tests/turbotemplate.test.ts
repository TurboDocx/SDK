/**
 * TurboTemplate Module Tests
 *
 * Tests for advanced templating features:
 * - Helper functions (createSimpleVariable, createAdvancedEngineVariable, etc.)
 * - Variable validation
 * - Generate template functionality
 * - Placeholder and name handling
 */

import { TurboTemplate } from '../src/modules/template';
import { HttpClient } from '../src/http';

// Mock the HttpClient
jest.mock('../src/http');

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('TurboTemplate Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static client
    (TurboTemplate as any).client = undefined;

    // Mock getSenderConfig to return default values
    MockedHttpClient.prototype.getSenderConfig = jest.fn().mockReturnValue({
      senderEmail: 'test@company.com',
      senderName: 'Test Company',
    });
  });

  describe('configure', () => {
    it('should configure the client with API key', () => {
      TurboTemplate.configure({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'test@company.com',
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'test@company.com',
      });
    });

    it('should configure with custom base URL', () => {
      TurboTemplate.configure({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'test@company.com',
        baseUrl: 'https://custom-api.example.com',
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        orgId: 'test-org-id',
        senderEmail: 'test@company.com',
        baseUrl: 'https://custom-api.example.com',
      });
    });
  });

  describe('Helper Functions', () => {
    describe('createSimpleVariable', () => {
      it('should create a simple variable with placeholder, name, value and mimeType', () => {
        const variable = TurboTemplate.createSimpleVariable('{customer_name}', 'customer_name', 'Person A', 'text');

        expect(variable).toEqual({
          placeholder: '{customer_name}',
          name: 'customer_name',
          value: 'Person A',
          mimeType: 'text',
        });
      });

      it('should create a simple variable with number value', () => {
        const variable = TurboTemplate.createSimpleVariable('{order_total}', 'order_total', 1500, 'text');

        expect(variable).toEqual({
          placeholder: '{order_total}',
          name: 'order_total',
          value: 1500,
          mimeType: 'text',
        });
      });

      it('should create a simple variable with boolean value', () => {
        const variable = TurboTemplate.createSimpleVariable('{is_active}', 'is_active', true, 'text');

        expect(variable).toEqual({
          placeholder: '{is_active}',
          name: 'is_active',
          value: true,
          mimeType: 'text',
        });
      });

      it('should create a simple variable with html mimeType', () => {
        const variable = TurboTemplate.createSimpleVariable('{content}', 'content', '<b>Bold</b>', 'html');

        expect(variable).toEqual({
          placeholder: '{content}',
          name: 'content',
          value: '<b>Bold</b>',
          mimeType: 'html',
        });
      });

      it('should throw error when placeholder is missing', () => {
        expect(() => TurboTemplate.createSimpleVariable('', 'name', 'value', 'text')).toThrow('placeholder is required');
      });

      it('should throw error when name is missing', () => {
        expect(() => TurboTemplate.createSimpleVariable('{test}', '', 'value', 'text')).toThrow('name is required');
      });

      it('should throw error when mimeType is missing', () => {
        expect(() => TurboTemplate.createSimpleVariable('{test}', 'test', 'value', '' as any)).toThrow('mimeType is required');
      });
    });

    describe('createAdvancedEngineVariable', () => {
      it('should create a nested variable with object value', () => {
        const variable = TurboTemplate.createAdvancedEngineVariable('{user}', 'user', {
          firstName: 'Foo',
          lastName: 'Bar',
          email: 'foo@example.com',
        });

        expect(variable).toEqual({
          placeholder: '{user}',
          name: 'user',
          value: {
            firstName: 'Foo',
            lastName: 'Bar',
            email: 'foo@example.com',
          },
          mimeType: 'json',
          usesAdvancedTemplatingEngine: true,
        });
      });

      it('should create a nested variable with deeply nested object', () => {
        const variable = TurboTemplate.createAdvancedEngineVariable('{company}', 'company', {
          name: 'Company ABC',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'TS',
          },
        });

        expect(variable.value).toEqual({
          name: 'Company ABC',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'TS',
          },
        });
        expect(variable.mimeType).toBe('json');
        expect(variable.usesAdvancedTemplatingEngine).toBe(true);
      });

      it('should throw error when placeholder is missing', () => {
        expect(() => TurboTemplate.createAdvancedEngineVariable('', 'user', { name: 'Test' })).toThrow('placeholder is required');
      });

      it('should throw error when name is missing', () => {
        expect(() => TurboTemplate.createAdvancedEngineVariable('{user}', '', { name: 'Test' })).toThrow('name is required');
      });
    });

    describe('createLoopVariable', () => {
      it('should create a loop variable with array value', () => {
        const variable = TurboTemplate.createLoopVariable('{items}', 'items', [
          { name: 'Item A', price: 100 },
          { name: 'Item B', price: 200 },
        ]);

        expect(variable).toEqual({
          placeholder: '{items}',
          name: 'items',
          value: [
            { name: 'Item A', price: 100 },
            { name: 'Item B', price: 200 },
          ],
          mimeType: 'json',
          usesAdvancedTemplatingEngine: true,
        });
      });

      it('should create a loop variable with empty array', () => {
        const variable = TurboTemplate.createLoopVariable('{products}', 'products', []);

        expect(variable.value).toEqual([]);
        expect(variable.mimeType).toBe('json');
      });

      it('should create a loop variable with primitive array', () => {
        const variable = TurboTemplate.createLoopVariable('{tags}', 'tags', ['tag1', 'tag2', 'tag3']);

        expect(variable.value).toEqual(['tag1', 'tag2', 'tag3']);
      });

      it('should throw error when placeholder is missing', () => {
        expect(() => TurboTemplate.createLoopVariable('', 'items', [])).toThrow('placeholder is required');
      });

      it('should throw error when name is missing', () => {
        expect(() => TurboTemplate.createLoopVariable('{items}', '', [])).toThrow('name is required');
      });
    });

    describe('createConditionalVariable', () => {
      it('should create a conditional variable with boolean true', () => {
        const variable = TurboTemplate.createConditionalVariable('{is_premium}', 'is_premium', true);

        expect(variable).toEqual({
          placeholder: '{is_premium}',
          name: 'is_premium',
          value: true,
          mimeType: 'json',
          usesAdvancedTemplatingEngine: true,
        });
      });

      it('should create a conditional variable with boolean false', () => {
        const variable = TurboTemplate.createConditionalVariable('{show_discount}', 'show_discount', false);

        expect(variable.value).toBe(false);
        expect(variable.mimeType).toBe('json');
        expect(variable.usesAdvancedTemplatingEngine).toBe(true);
      });

      it('should create a conditional variable with truthy value', () => {
        const variable = TurboTemplate.createConditionalVariable('{count}', 'count', 5);

        expect(variable.value).toBe(5);
        expect(variable.mimeType).toBe('json');
      });

      it('should throw error when placeholder is missing', () => {
        expect(() => TurboTemplate.createConditionalVariable('', 'is_active', true)).toThrow('placeholder is required');
      });

      it('should throw error when name is missing', () => {
        expect(() => TurboTemplate.createConditionalVariable('{is_active}', '', true)).toThrow('name is required');
      });
    });

    describe('createImageVariable', () => {
      it('should create an image variable with URL', () => {
        const variable = TurboTemplate.createImageVariable('{logo}', 'logo', 'https://example.com/logo.png');

        expect(variable).toEqual({
          placeholder: '{logo}',
          name: 'logo',
          value: 'https://example.com/logo.png',
          mimeType: 'image',
        });
      });

      it('should create an image variable with base64', () => {
        const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...';
        const variable = TurboTemplate.createImageVariable('{signature}', 'signature', base64Image);

        expect(variable.value).toBe(base64Image);
        expect(variable.mimeType).toBe('image');
      });

      it('should throw error when placeholder is missing', () => {
        expect(() => TurboTemplate.createImageVariable('', 'logo', 'https://example.com/logo.png')).toThrow('placeholder is required');
      });

      it('should throw error when name is missing', () => {
        expect(() => TurboTemplate.createImageVariable('{logo}', '', 'https://example.com/logo.png')).toThrow('name is required');
      });

      it('should throw error when imageUrl is missing', () => {
        expect(() => TurboTemplate.createImageVariable('{logo}', 'logo', '')).toThrow('imageUrl is required');
      });
    });
  });

  describe('validateVariable', () => {
    it('should validate a correct simple variable', () => {
      const result = TurboTemplate.validateVariable({
        placeholder: '{name}',
        name: 'name',
        value: 'Test',
        mimeType: 'text',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return error when placeholder or name is missing', () => {
      const result = TurboTemplate.validateVariable({
        value: 'Test',
      } as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Variable must have both "placeholder" and "name" properties');
    });

    it('should allow variable without value and text properties', () => {
      const result = TurboTemplate.validateVariable({
        placeholder: '{name}',
        name: 'name',
      } as any);

      expect(result.isValid).toBe(true);
    });

    it('should warn about array without json mimeType', () => {
      const result = TurboTemplate.validateVariable({
        placeholder: '{items}',
        name: 'items',
        value: [1, 2, 3],
        mimeType: 'text',
      } as any);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Array values should use mimeType: "json"');
    });

    it('should not warn about array with json mimeType', () => {
      const result = TurboTemplate.validateVariable({
        placeholder: '{items}',
        name: 'items',
        value: [1, 2, 3],
        mimeType: 'json',
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should validate image variable with string value', () => {
      const result = TurboTemplate.validateVariable({
        placeholder: '{logo}',
        name: 'logo',
        value: 'https://example.com/logo.png',
        mimeType: 'image',
      });

      expect(result.isValid).toBe(true);
    });

    it('should return error for image variable with non-string value', () => {
      const result = TurboTemplate.validateVariable({
        placeholder: '{logo}',
        name: 'logo',
        value: 123,
        mimeType: 'image',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image variables must have a string value (URL or base64)');
    });

    it('should warn about object without explicit mimeType', () => {
      const result = TurboTemplate.validateVariable({
        placeholder: '{user}',
        name: 'user',
        value: { name: 'Test' },
        mimeType: 'text',
      } as any);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Complex objects should explicitly set mimeType to "json"');
    });
  });

  describe('generate', () => {
    it('should generate document with simple variables', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-123',
        message: 'Document generated successfully',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      const result = await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Test Document',
        description: 'Test description',
        variables: [
          { placeholder: '{customer_name}', name: 'customer_name', value: 'Person A', mimeType: 'text' },
          { placeholder: '{order_total}', name: 'order_total', value: 1500, mimeType: 'text' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.deliverableId).toBe('doc-123');
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/v1/deliverable',
        expect.objectContaining({
          templateId: 'template-123',
          name: 'Test Document',
          description: 'Test description',
          variables: expect.arrayContaining([
            expect.objectContaining({
              placeholder: '{customer_name}',
              name: 'customer_name',
              value: 'Person A',
              mimeType: 'text',
            }),
            expect.objectContaining({
              placeholder: '{order_total}',
              name: 'order_total',
              value: 1500,
              mimeType: 'text',
            }),
          ]),
        })
      );
    });

    it('should generate document with nested object variables', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-456',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      const result = await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Nested Document',
        description: 'Document with nested objects',
        variables: [
          {
            placeholder: '{user}',
            name: 'user',
            mimeType: 'json',
            value: {
              firstName: 'Foo',
              lastName: 'Bar',
              profile: {
                company: 'Company ABC',
              },
            },
            usesAdvancedTemplatingEngine: true,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/v1/deliverable',
        expect.objectContaining({
          variables: expect.arrayContaining([
            expect.objectContaining({
              placeholder: '{user}',
              name: 'user',
              mimeType: 'json',
              usesAdvancedTemplatingEngine: true,
              value: {
                firstName: 'Foo',
                lastName: 'Bar',
                profile: {
                  company: 'Company ABC',
                },
              },
            }),
          ]),
        })
      );
    });

    it('should generate document with loop/array variables', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-789',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      const result = await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Loop Document',
        description: 'Document with loops',
        variables: [
          {
            placeholder: '{items}',
            name: 'items',
            mimeType: 'json',
            value: [
              { name: 'Item A', quantity: 5, price: 100 },
              { name: 'Item B', quantity: 3, price: 200 },
            ],
            usesAdvancedTemplatingEngine: true,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/v1/deliverable',
        expect.objectContaining({
          variables: expect.arrayContaining([
            expect.objectContaining({
              placeholder: '{items}',
              name: 'items',
              mimeType: 'json',
            }),
          ]),
        })
      );
    });

    it('should generate document with helper-created variables', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-helper',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      const result = await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Helper Document',
        description: 'Document using helper functions',
        variables: [
          TurboTemplate.createSimpleVariable('{title}', 'title', 'Quarterly Report', 'text'),
          TurboTemplate.createAdvancedEngineVariable('{company}', 'company', { name: 'Company XYZ', employees: 500 }),
          TurboTemplate.createLoopVariable('{departments}', 'departments', [{ name: 'Dept A' }, { name: 'Dept B' }]),
          TurboTemplate.createConditionalVariable('{show_financials}', 'show_financials', true),
          TurboTemplate.createImageVariable('{logo}', 'logo', 'https://example.com/logo.png'),
        ],
      });

      expect(result.success).toBe(true);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalled();
    });

    it('should include optional request parameters', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-options',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Options Document',
        description: 'Document with all options',
        variables: [{ placeholder: '{test}', name: 'test', value: 'value', mimeType: 'text' }],
        replaceFonts: true,
        defaultFont: 'Arial',
        outputFormat: 'pdf',
        metadata: { customField: 'value' },
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/v1/deliverable',
        expect.objectContaining({
          replaceFonts: true,
          defaultFont: 'Arial',
          outputFormat: 'pdf',
          metadata: { customField: 'value' },
        })
      );
    });

    it('should allow variable with no value or text property', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-no-value',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      const result = await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'No Value Document',
        description: 'Document with variable that has no value/text',
        variables: [{ placeholder: '{test}', name: 'test', mimeType: 'text' } as any],
      });

      expect(result.success).toBe(true);
      expect(result.deliverableId).toBe('doc-no-value');
    });

    it('should handle text property as fallback', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-text',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Text Document',
        description: 'Document using text property',
        variables: [{ placeholder: '{legacy}', name: 'legacy', text: 'Legacy value', mimeType: 'text' }],
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/v1/deliverable',
        expect.objectContaining({
          variables: expect.arrayContaining([
            expect.objectContaining({
              placeholder: '{legacy}',
              name: 'legacy',
              text: 'Legacy value',
            }),
          ]),
        })
      );
    });

    it('should allow variable with null value', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-null',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      const result = await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Null Value Document',
        description: 'Document with null value',
        variables: [{ placeholder: '{test}', name: 'test', value: null, mimeType: 'text' }],
      });

      expect(result.success).toBe(true);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/v1/deliverable',
        expect.objectContaining({
          variables: expect.arrayContaining([
            expect.objectContaining({
              placeholder: '{test}',
              name: 'test',
              value: null,
            }),
          ]),
        })
      );
    });

    it('should allow variable with undefined value', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-undefined',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      const result = await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Undefined Value Document',
        description: 'Document with undefined value',
        variables: [{ placeholder: '{test}', name: 'test', value: undefined, mimeType: 'text' }],
      });

      expect(result.success).toBe(true);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/v1/deliverable',
        expect.objectContaining({
          variables: expect.arrayContaining([
            expect.objectContaining({
              placeholder: '{test}',
              name: 'test',
              value: undefined,
            }),
          ]),
        })
      );
    });
  });

  describe('Placeholder and Name Handling', () => {
    it('should require both placeholder and name in generated request', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-both',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Both Fields Document',
        description: 'Document with both placeholder and name',
        variables: [
          { placeholder: '{customer}', name: 'customer', value: 'Person A', mimeType: 'text' },
        ],
      });

      const callArgs = (MockedHttpClient.prototype.post as jest.Mock).mock.calls[0][1];
      expect(callArgs.variables[0].placeholder).toBe('{customer}');
      expect(callArgs.variables[0].name).toBe('customer');
    });

    it('should allow distinct placeholder and name values', async () => {
      const mockResponse = {
        success: true,
        deliverableId: 'doc-distinct',
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboTemplate.configure({ apiKey: 'test-key' });

      await TurboTemplate.generate({
        templateId: 'template-123',
        name: 'Distinct Fields Document',
        description: 'Document with distinct placeholder and name',
        variables: [
          { placeholder: '{cust_name}', name: 'customerFullName', value: 'Person A', mimeType: 'text' },
        ],
      });

      const callArgs = (MockedHttpClient.prototype.post as jest.Mock).mock.calls[0][1];
      expect(callArgs.variables[0].placeholder).toBe('{cust_name}');
      expect(callArgs.variables[0].name).toBe('customerFullName');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const apiError = {
        statusCode: 404,
        message: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND',
      };

      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(apiError);
      TurboTemplate.configure({ apiKey: 'test-key' });

      await expect(
        TurboTemplate.generate({
          templateId: 'invalid-template',
          name: 'Error Document',
          description: 'Document that should fail',
          variables: [{ placeholder: '{test}', name: 'test', value: 'value', mimeType: 'text' }],
        })
      ).rejects.toEqual(apiError);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ path: ['variables', 0, 'value'], message: 'Value is required' }],
      };

      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(validationError);
      TurboTemplate.configure({ apiKey: 'test-key' });

      await expect(
        TurboTemplate.generate({
          templateId: 'template-123',
          name: 'Validation Error Document',
          description: 'Document that should fail validation',
          variables: [{ placeholder: '{test}', name: 'test', value: '', mimeType: 'text' }],
        })
      ).rejects.toEqual(validationError);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = {
        statusCode: 429,
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
      };

      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(rateLimitError);
      TurboTemplate.configure({ apiKey: 'test-key' });

      await expect(
        TurboTemplate.generate({
          templateId: 'template-123',
          name: 'Rate Limit Document',
          description: 'Document that should hit rate limit',
          variables: [{ placeholder: '{test}', name: 'test', value: 'value', mimeType: 'text' }],
        })
      ).rejects.toEqual(rateLimitError);
    });
  });
});
