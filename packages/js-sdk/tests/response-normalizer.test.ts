/**
 * Response Normalizer Tests
 *
 * MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
 * The normalizer coerces these to proper boolean/number types so SDK
 * consumers always get the types declared in the TypeScript interfaces.
 */

import { normalizeResponse } from '../src/utils/response-normalizer';

describe('normalizeResponse', () => {
  describe('boolean coercion (MySQL tinyint)', () => {
    it('should convert 0 to false for known boolean fields', () => {
      const input = { isActive: 0, isDefault: 0, showInCatalog: 0 };
      const result = normalizeResponse(input);
      expect(result.isActive).toBe(false);
      expect(result.isDefault).toBe(false);
      expect(result.showInCatalog).toBe(false);
    });

    it('should convert 1 to true for known boolean fields', () => {
      const input = { isActive: 1, isDefault: 1, showInCatalog: 1 };
      const result = normalizeResponse(input);
      expect(result.isActive).toBe(true);
      expect(result.isDefault).toBe(true);
      expect(result.showInCatalog).toBe(true);
    });

    it('should handle all known boolean fields', () => {
      const input = {
        isActive: 1,
        isDefault: 0,
        showInCatalog: 1,
        showInQuoteBuilder: 0,
        showItemsToEndUser: 1,
        syncWithProducts: 0,
        isPrimaryAdmin: 1,
        canManageOrgs: 1,
        canManageUsers: 0,
        canManageBilling: 1,
        canViewAuditLog: 0,
        hasFileDownload: 1,
        hasGDrive: 0,
        rdWatermark: 1,
      };
      const result = normalizeResponse(input);
      expect(result.isActive).toBe(true);
      expect(result.isDefault).toBe(false);
      expect(result.showInCatalog).toBe(true);
      expect(result.showInQuoteBuilder).toBe(false);
      expect(result.showItemsToEndUser).toBe(true);
      expect(result.syncWithProducts).toBe(false);
      expect(result.isPrimaryAdmin).toBe(true);
      expect(result.canManageOrgs).toBe(true);
      expect(result.canManageUsers).toBe(false);
      expect(result.canManageBilling).toBe(true);
      expect(result.canViewAuditLog).toBe(false);
      expect(result.hasFileDownload).toBe(true);
      expect(result.hasGDrive).toBe(false);
      expect(result.rdWatermark).toBe(true);
    });

    it('should leave actual booleans unchanged', () => {
      const input = { isActive: true, isDefault: false };
      const result = normalizeResponse(input);
      expect(result.isActive).toBe(true);
      expect(result.isDefault).toBe(false);
    });

    it('should not convert non-boolean fields that happen to be 0 or 1', () => {
      const input = { quantity: 1, offset: 0, name: 'test' };
      const result = normalizeResponse(input);
      expect(result.quantity).toBe(1);
      expect(result.offset).toBe(0);
      expect(result.name).toBe('test');
    });
  });

  describe('decimal coercion (MySQL decimal strings)', () => {
    it('should convert string decimals to numbers for known numeric fields', () => {
      const input = { listPrice: '99.99', cost: '50.00', unitPrice: '25.50' };
      const result = normalizeResponse(input);
      expect(result.listPrice).toBe(99.99);
      expect(result.cost).toBe(50);
      expect(result.unitPrice).toBe(25.5);
    });

    it('should handle all known decimal fields', () => {
      const input = {
        listPrice: '100.00',
        cost: '50.00',
        unitPrice: '75.50',
        discountPercent: '10.00',
        subtotal: '67.95',
        grandTotal: '1234.56',
        subtotalMonthly: '500.00',
        subtotalQuarterly: '1500.00',
        subtotalAnnual: '6000.00',
        subtotalOneTime: '200.00',
        taxAmount: '48.00',
        taxRate: '8.50',
        bundleDiscountPercent: '15.00',
        totalListPrice: '1000.00',
        totalFinalPrice: '850.00',
        totalCost: '400.00',
        finalPrice: '85.00',
        marginPercent: '45.00',
      };
      const result = normalizeResponse(input);
      expect(result.listPrice).toBe(100);
      expect(result.cost).toBe(50);
      expect(result.unitPrice).toBe(75.5);
      expect(result.discountPercent).toBe(10);
      expect(result.subtotal).toBe(67.95);
      expect(result.grandTotal).toBe(1234.56);
      expect(result.subtotalMonthly).toBe(500);
      expect(result.subtotalQuarterly).toBe(1500);
      expect(result.subtotalAnnual).toBe(6000);
      expect(result.subtotalOneTime).toBe(200);
      expect(result.taxAmount).toBe(48);
      expect(result.taxRate).toBe(8.5);
      expect(result.bundleDiscountPercent).toBe(15);
      expect(result.totalListPrice).toBe(1000);
      expect(result.totalFinalPrice).toBe(850);
      expect(result.totalCost).toBe(400);
      expect(result.finalPrice).toBe(85);
      expect(result.marginPercent).toBe(45);
    });

    it('should leave actual numbers unchanged', () => {
      const input = { listPrice: 99.99, quantity: 5 };
      const result = normalizeResponse(input);
      expect(result.listPrice).toBe(99.99);
      expect(result.quantity).toBe(5);
    });

    it('should handle null decimal fields', () => {
      const input = { cost: null, taxRate: null, marginPercent: null };
      const result = normalizeResponse(input);
      expect(result.cost).toBeNull();
      expect(result.taxRate).toBeNull();
      expect(result.marginPercent).toBeNull();
    });

    it('should not convert non-numeric string fields', () => {
      const input = { name: '99.99', quoteNumber: 'Q-2026-00001', status: 'draft' };
      const result = normalizeResponse(input);
      expect(result.name).toBe('99.99');
      expect(result.quoteNumber).toBe('Q-2026-00001');
      expect(result.status).toBe('draft');
    });
  });

  describe('nested objects', () => {
    it('should normalize fields in nested objects', () => {
      const input = {
        id: 'q-1',
        isActive: 1,
        grandTotal: '500.00',
        company: {
          id: 'c-1',
          isActive: 1,
          name: 'Acme',
        },
        contact: {
          id: 'ct-1',
          isActive: 0,
        },
      };
      const result = normalizeResponse(input);
      expect(result.isActive).toBe(true);
      expect(result.grandTotal).toBe(500);
      expect(result.company.isActive).toBe(true);
      expect(result.company.name).toBe('Acme');
      expect(result.contact.isActive).toBe(false);
    });

    it('should normalize deeply nested objects', () => {
      const input = {
        items: [{
          id: 'li-1',
          isActive: 1,
          unitPrice: '50.00',
          showItemsToEndUser: 0,
          product: {
            id: 'p-1',
            isActive: 1,
            listPrice: '100.00',
            showInCatalog: 1,
          },
        }],
      };
      const result = normalizeResponse(input);
      expect(result.items[0].isActive).toBe(true);
      expect(result.items[0].unitPrice).toBe(50);
      expect(result.items[0].showItemsToEndUser).toBe(false);
      expect(result.items[0].product.isActive).toBe(true);
      expect(result.items[0].product.listPrice).toBe(100);
      expect(result.items[0].product.showInCatalog).toBe(true);
    });
  });

  describe('arrays', () => {
    it('should normalize objects inside arrays', () => {
      const input = [
        { id: '1', isActive: 1, listPrice: '10.00' },
        { id: '2', isActive: 0, listPrice: '20.00' },
      ];
      const result = normalizeResponse(input);
      expect(result[0].isActive).toBe(true);
      expect(result[0].listPrice).toBe(10);
      expect(result[1].isActive).toBe(false);
      expect(result[1].listPrice).toBe(20);
    });

    it('should handle results array pattern', () => {
      const input = {
        results: [
          { id: '1', isActive: 1, grandTotal: '100.00' },
          { id: '2', isActive: 0, grandTotal: '200.00' },
        ],
        totalRecords: 2,
      };
      const result = normalizeResponse(input);
      expect(result.results[0].isActive).toBe(true);
      expect(result.results[0].grandTotal).toBe(100);
      expect(result.results[1].isActive).toBe(false);
      expect(result.results[1].grandTotal).toBe(200);
      expect(result.totalRecords).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should return primitives unchanged', () => {
      expect(normalizeResponse('hello')).toBe('hello');
      expect(normalizeResponse(42)).toBe(42);
      expect(normalizeResponse(null)).toBeNull();
      expect(normalizeResponse(undefined)).toBeUndefined();
    });

    it('should handle empty objects', () => {
      expect(normalizeResponse({})).toEqual({});
    });

    it('should handle empty arrays', () => {
      expect(normalizeResponse([])).toEqual([]);
    });

    it('should not mutate the original object', () => {
      const input = { isActive: 1, listPrice: '99.99' };
      const result = normalizeResponse(input);
      expect(input.isActive).toBe(1);
      expect(input.listPrice).toBe('99.99');
      expect(result.isActive).toBe(true);
      expect(result.listPrice).toBe(99.99);
    });
  });
});
