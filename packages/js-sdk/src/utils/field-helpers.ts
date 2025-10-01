/**
 * Helper utilities for TurboSign field processing
 */

import type { SignatureFieldType, SimplifiedField, SignatureField } from '../types/sign';

/**
 * Golden ratio for aesthetically pleasing color distribution
 */
const GOLDEN_RATIO = 0.618033988749895;

/**
 * Generate a beautiful color using HSL and golden ratio
 * @param index - Recipient index
 * @returns Object with color and lightColor
 */
export function generateRecipientColors(index: number): { color: string; lightColor: string } {
  // Use golden ratio to distribute hues evenly across color spectrum
  const hue = Math.floor((index * GOLDEN_RATIO * 360) % 360);
  const saturation = 75; // Vibrant colors
  const lightness = 50; // Medium lightness for good contrast

  return {
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    lightColor: `hsl(${hue}, ${saturation}%, 93%)` // Much lighter for backgrounds
  };
}

/**
 * Default field sizes based on field type
 */
const DEFAULT_FIELD_SIZES: Record<SignatureFieldType, { width: number; height: number }> = {
  signature: { width: 200, height: 50 },
  initial: { width: 100, height: 50 },
  date: { width: 150, height: 30 },
  text: { width: 200, height: 30 },
  full_name: { width: 200, height: 30 },
  first_name: { width: 150, height: 30 },
  last_name: { width: 150, height: 30 },
  title: { width: 200, height: 30 },
  company: { width: 200, height: 30 },
  email: { width: 200, height: 30 }
};

/**
 * Standard US Letter page size in points (8.5" x 11" at 72 DPI)
 */
const DEFAULT_PAGE_SIZE = {
  width: 612,
  height: 792
};

/**
 * Get default size for a field type
 * @param type - Field type
 * @returns Default width and height
 */
export function getDefaultFieldSize(type: SignatureFieldType): { width: number; height: number } {
  return DEFAULT_FIELD_SIZES[type] || { width: 200, height: 50 };
}

/**
 * Normalize simplified fields to full SignatureField format
 * @param fields - Simplified fields from user
 * @param recipientEmailToId - Map of email to recipient ID
 * @param recipientIndexToId - Map of index to recipient ID
 * @returns Full SignatureField array ready for API
 */
export function normalizeFields(
  fields: SimplifiedField[],
  recipientEmailToId: Map<string, string>,
  recipientIndexToId: Map<number, string>
): SignatureField[] {
  return fields.map(field => {
    // Get recipient ID
    let recipientId: string;
    if ('recipientEmail' in field) {
      const id = recipientEmailToId.get(field.recipientEmail);
      if (!id) {
        throw new Error(`Recipient with email "${field.recipientEmail}" not found`);
      }
      recipientId = id;
    } else if ('recipientIndex' in field) {
      const id = recipientIndexToId.get(field.recipientIndex);
      if (!id) {
        throw new Error(`Recipient at index ${field.recipientIndex} not found`);
      }
      recipientId = id;
    } else {
      throw new Error('Field must specify either recipientEmail or recipientIndex');
    }

    // Template-based field
    if ('anchor' in field) {
      return {
        type: field.type,
        recipientId,
        page: field.page,
        x: 0, // Will be calculated by backend
        y: 0,
        width: field.size?.width || getDefaultFieldSize(field.type).width,
        height: field.size?.height || getDefaultFieldSize(field.type).height,
        pageWidth: DEFAULT_PAGE_SIZE.width,
        pageHeight: DEFAULT_PAGE_SIZE.height,
        defaultValue: field.defaultValue,
        required: field.required !== false, // Default to true
        label: field.label,
        isMultiline: field.isMultiline,
        // Template data would be sent separately in actual implementation
        // This is a simplification - backend handles template positioning
      } as SignatureField;
    }

    // Coordinate-based field
    const defaultSize = getDefaultFieldSize(field.type);
    return {
      type: field.type,
      recipientId,
      page: field.page,
      x: field.x,
      y: field.y,
      width: field.width ?? defaultSize.width,
      height: field.height ?? defaultSize.height,
      pageWidth: field.pageWidth ?? DEFAULT_PAGE_SIZE.width,
      pageHeight: field.pageHeight ?? DEFAULT_PAGE_SIZE.height,
      defaultValue: field.defaultValue,
      required: field.required !== false, // Default to true
      label: field.label,
      isMultiline: field.isMultiline
    };
  });
}

/**
 * Extract clean file name from a path or file object
 * @param file - File object or buffer
 * @param providedName - User-provided name (optional)
 * @returns Clean file name without extension
 */
export function extractFileName(file: any, providedName?: string): string {
  if (providedName) {
    // Remove .pdf extension if present
    return providedName.replace(/\.pdf$/i, '');
  }

  // Try to get name from File object
  if (file && typeof file === 'object' && 'name' in file) {
    return (file.name as string).replace(/\.pdf$/i, '');
  }

  // Default fallback
  return 'Document';
}
