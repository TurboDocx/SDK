/**
 * TurboTemplate Advanced Templating Examples
 *
 * This file demonstrates the advanced templating features introduced
 * in the RapidDocxBackend PR #1057.
 *
 * Key points for variable configuration:
 * - Placeholders should include curly braces: "{variable_name}"
 * - For objects/arrays, use mimeType: 'json'
 * - For expressions on simple values, use mimeType: 'text' with usesAdvancedTemplatingEngine: true
 * - Boolean/number values with mimeType: 'json' work for conditionals
 */

import { TurboTemplate } from '../src';

// Configure the client
TurboTemplate.configure({
  apiKey: process.env.TURBODOCX_API_KEY!,
  orgId: process.env.TURBODOCX_ORG_ID!,
});

/**
 * Example 1: Simple Variable Substitution
 *
 * Template: "Dear {firstName}, your email is {simpleEmail}."
 */
async function simpleSubstitution() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Simple Substitution Document',
    description: 'Basic variable substitution example',
    variables: [
      { placeholder: '{firstName}', name: 'firstName', mimeType: 'text', value: 'Foo' },
      { placeholder: '{lastName}', name: 'lastName', mimeType: 'text', value: 'Bar' },
      { placeholder: '{simpleEmail}', name: 'simpleEmail', mimeType: 'text', value: 'foo.bar@example.com' },
    ],
  });

  console.log('Document generated:', result.id);
}

/**
 * Example 2: Nested Objects with Dot Notation
 *
 * Template: "Name: {user.firstName}, Email: {user.email}"
 */
async function nestedObjects() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Nested Objects Document',
    description: 'Nested object with dot notation example',
    variables: [
      {
        placeholder: '{user}',
        name: 'user',
        mimeType: 'json',
        value: {
          firstName: 'Foo',
          email: 'foo@example.com',
        },
      },
    ],
  });

  console.log('Document with nested data generated:', result.id);
}

/**
 * Example 3: Deep Nested Objects
 *
 * Template: "Team Lead: {company.divisions.engineering.teamLead.name}"
 */
async function deepNestedObjects() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Deep Nested Objects Document',
    description: 'Deep nested object example',
    variables: [
      {
        placeholder: '{company}',
        name: 'company',
        mimeType: 'json',
        value: {
          divisions: {
            engineering: {
              teamLead: {
                name: 'Person A',
                contact: {
                  phone: '+1-555-0000',
                  email: 'persona@example.com',
                },
              },
            },
          },
        },
      },
    ],
  });

  console.log('Document with deep nested data generated:', result.id);
}

/**
 * Example 4: Array Loops
 *
 * Template:
 * {#products}
 * - {name}: ${price}
 * {/products}
 */
async function loopsAndArrays() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Array Loops Document',
    description: 'Array loop iteration example',
    variables: [
      {
        placeholder: '{products}',
        name: 'products',
        mimeType: 'json',
        value: [
          { name: 'Item A', price: 999 },
          { name: 'Item B', price: 29 },
          { name: 'Item C', price: 79 },
        ],
      },
    ],
  });

  console.log('Document with loop generated:', result.id);
}

/**
 * Example 5: Conditionals with Boolean Values
 *
 * Template:
 * {#isActive}User is active{/isActive}
 * {^isActive}User is inactive{/isActive}
 */
async function conditionals() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Conditionals Document',
    description: 'Boolean conditional example',
    variables: [
      { placeholder: '{isActive}', name: 'isActive', mimeType: 'json', value: true },
      { placeholder: '{isPremium}', name: 'isPremium', mimeType: 'json', value: false },
      { placeholder: '{score}', name: 'score', mimeType: 'json', value: 85 },
    ],
  });

  console.log('Document with conditionals generated:', result.id);
}

/**
 * Example 6: Expressions and Calculations
 *
 * For arithmetic expressions, use mimeType: 'text' with string/number values
 * and usesAdvancedTemplatingEngine: true
 *
 * Template: "Total: {price + tax}", "Result: {a + b}"
 */
async function expressionsAndCalculations() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Expressions Document',
    description: 'Arithmetic expressions example',
    variables: [
      {
        placeholder: '{price}',
        name: 'price',
        mimeType: 'text',
        value: '100',
        usesAdvancedTemplatingEngine: true,
      },
      {
        placeholder: '{tax}',
        name: 'tax',
        mimeType: 'text',
        value: '15',
        usesAdvancedTemplatingEngine: true,
      },
      {
        placeholder: '{a}',
        name: 'a',
        mimeType: 'text',
        value: 20,
        usesAdvancedTemplatingEngine: true,
      },
      {
        placeholder: '{b}',
        name: 'b',
        mimeType: 'text',
        value: 0,
        usesAdvancedTemplatingEngine: true,
      },
    ],
  });

  console.log('Document with expressions generated:', result.id);
}

/**
 * Example 7: Complex Expressions
 *
 * Template: "Final: {basePrice * quantity + shipping - discount}"
 */
async function complexExpressions() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Complex Expressions Document',
    description: 'Complex arithmetic expressions example',
    variables: [
      { placeholder: '{basePrice}', name: 'basePrice', mimeType: 'text', value: '50', usesAdvancedTemplatingEngine: true },
      { placeholder: '{quantity}', name: 'quantity', mimeType: 'text', value: '3', usesAdvancedTemplatingEngine: true },
      { placeholder: '{shipping}', name: 'shipping', mimeType: 'text', value: '10', usesAdvancedTemplatingEngine: true },
      { placeholder: '{discount}', name: 'discount', mimeType: 'text', value: '25', usesAdvancedTemplatingEngine: true },
    ],
  });

  console.log('Document with complex expressions generated:', result.id);
}

/**
 * Example 8: Object Property Expressions
 *
 * Template: "Item Total: {item.price * item.quantity}"
 */
async function objectPropertyExpressions() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Object Property Expressions Document',
    description: 'Object property in expressions example',
    variables: [
      {
        placeholder: '{item}',
        name: 'item',
        mimeType: 'json',
        value: {
          price: 25,
          quantity: 4,
        },
      },
    ],
  });

  console.log('Document with object property expressions generated:', result.id);
}

/**
 * Example 9: Nested Loops with Objects
 *
 * Template:
 * {#departments}
 * Department: {deptName}
 *   {#employees}
 *   - {employeeName}: {title}
 *   {/employees}
 * {/departments}
 */
async function nestedLoops() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Nested Loops Document',
    description: 'Nested array loops example',
    variables: [
      {
        placeholder: '{departments}',
        name: 'departments',
        mimeType: 'json',
        value: [
          {
            deptName: 'Dept X',
            employees: [
              { employeeName: 'Person A', title: 'Role 1' },
              { employeeName: 'Person B', title: 'Role 2' },
            ],
          },
          {
            deptName: 'Dept Y',
            employees: [{ employeeName: 'Person C', title: 'Role 3' }],
          },
        ],
      },
    ],
  });

  console.log('Document with nested loops generated:', result.id);
}

/**
 * Example 10: Conditionals Inside Loops
 *
 * Template:
 * {#orderItems}
 * - {productName}: ${itemPrice} {#isOnSale}(ON SALE!){/isOnSale}
 * {/orderItems}
 */
async function conditionalsInLoops() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Conditionals In Loops Document',
    description: 'Conditionals inside loops example',
    variables: [
      {
        placeholder: '{orderItems}',
        name: 'orderItems',
        mimeType: 'json',
        value: [
          { productName: 'Product X', itemPrice: 10, isOnSale: true, qty: 3 },
          { productName: 'Product Y', itemPrice: 25, isOnSale: false, qty: 10 },
          { productName: 'Product Z', itemPrice: 15, isOnSale: true, qty: 2 },
        ],
      },
    ],
  });

  console.log('Document with conditionals in loops generated:', result.id);
}

/**
 * Example 11: Complex Invoice (Full Example)
 *
 * Combines: nested objects, loops, conditionals, expressions
 */
async function complexInvoice() {
  const result = await TurboTemplate.generate({
    templateId: 'invoice-template-id',
    name: 'Invoice - Company ABC',
    description: 'Monthly invoice',
    variables: [
      // Invoice header
      {
        placeholder: '{invoice}',
        name: 'invoice',
        mimeType: 'json',
        value: {
          number: 'INV-0000-00000',
          date: 'January 1, 2024',
          dueDate: 'February 1, 2024',
        },
      },

      // Customer with nested address
      {
        placeholder: '{invCustomer}',
        name: 'invCustomer',
        mimeType: 'json',
        value: {
          company: 'Company ABC LLC',
          address: {
            line1: '123 Test Street',
            line2: 'Suite 100',
            city: 'Test City',
            state: 'TS',
            zip: '00000',
          },
          contact: {
            name: 'Contact Person',
            email: 'contact@example.com',
          },
        },
      },

      // Line items (array for loop)
      {
        placeholder: '{invLineItems}',
        name: 'invLineItems',
        mimeType: 'json',
        value: [
          { sku: 'SKU-001', lineDesc: 'Service A', lineQty: 10, linePrice: 500, isTaxExempt: false },
          { sku: 'SKU-002', lineDesc: 'Service B', lineQty: 1, linePrice: 2000, isTaxExempt: false },
          { sku: 'SKU-003', lineDesc: 'Service C', lineQty: 5, linePrice: 200, isTaxExempt: true },
        ],
      },

      // Totals
      {
        placeholder: '{invTotals}',
        name: 'invTotals',
        mimeType: 'json',
        value: {
          subtotal: 8000,
          hasDiscount: true,
          discountCode: 'TESTCODE',
          discountAmount: 800,
          grandTotal: 7776,
        },
      },

      // Tax breakdown (array)
      {
        placeholder: '{taxBreakdown}',
        name: 'taxBreakdown',
        mimeType: 'json',
        value: [
          { taxName: 'Tax A', rate: 6, taxAmt: 432 },
          { taxName: 'Tax B', rate: 2, taxAmt: 144 },
        ],
      },

      // Payment info
      { placeholder: '{paymentTerms}', name: 'paymentTerms', mimeType: 'json', value: 'NET30' },
      { placeholder: '{invIsPaid}', name: 'invIsPaid', mimeType: 'json', value: false },
    ],
  });

  console.log('Complex invoice generated:', result.id);
}

/**
 * Example 12: Using Helper Functions
 *
 * Helper functions automatically add curly braces and set correct mimeType
 */
async function usingHelpers() {
  const result = await TurboTemplate.generate({
    templateId: 'your-template-id',
    name: 'Helper Functions Document',
    description: 'Using helper functions example',
    variables: [
      // Simple variable - helper adds {} and sets mimeType
      TurboTemplate.createSimpleVariable('{title}', 'title', 'Quarterly Report', 'text'),

      // Advanced engine variable - helper sets mimeType: 'json' and usesAdvancedTemplatingEngine: true
      TurboTemplate.createAdvancedEngineVariable('{company}', 'company', {
        name: 'Company XYZ',
        headquarters: 'Test Location',
        employees: 500,
      }),

      // Loop variable - helper sets mimeType: 'json' and usesAdvancedTemplatingEngine: true
      TurboTemplate.createLoopVariable('{departments}', 'departments', [
        { name: 'Dept A', headcount: 200 },
        { name: 'Dept B', headcount: 150 },
        { name: 'Dept C', headcount: 100 },
      ]),

      // Conditional - helper sets usesAdvancedTemplatingEngine: true
      TurboTemplate.createConditionalVariable('{show_financials}', 'show_financials', true),

      // Image - helper sets mimeType: 'image'
      TurboTemplate.createImageVariable('{company_logo}', 'company_logo', 'https://example.com/logo.png'),
    ],
  });

  console.log('Document with helpers generated:', result.id);
}

/**
 * Example 13: Variable Validation
 */
function variableValidation() {
  // Valid variable with proper configuration
  const validVariable = {
    placeholder: '{user}',
    name: 'user',
    mimeType: 'json' as const,
    value: { firstName: 'Foo', email: 'foo@example.com' },
  };

  const validation1 = TurboTemplate.validateVariable(validVariable);
  console.log('Valid variable:', validation1.isValid); // true

  // Variable missing placeholder
  const invalidVariable = {
    name: 'test',
    value: 'test',
  };

  const validation2 = TurboTemplate.validateVariable(invalidVariable as any);
  console.log('Invalid variable errors:', validation2.errors);

  // Variable with warnings (array without json mimeType)
  const warningVariable = {
    placeholder: '{items}',
    name: 'items',
    mimeType: 'text' as const,
    value: [1, 2, 3],
  };

  const validation3 = TurboTemplate.validateVariable(warningVariable);
  console.log('Variable warnings:', validation3.warnings);
}

// Run examples
async function main() {
  console.log('TurboTemplate Advanced Templating Examples\n');

  try {
    // Uncomment the examples you want to run:
    // await simpleSubstitution();
    // await nestedObjects();
    // await deepNestedObjects();
    // await loopsAndArrays();
    // await conditionals();
    // await expressionsAndCalculations();
    // await complexExpressions();
    // await objectPropertyExpressions();
    // await nestedLoops();
    // await conditionalsInLoops();
    // await complexInvoice();
    // await usingHelpers();
    // variableValidation();

    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// main();
