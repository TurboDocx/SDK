"""
TurboTemplate Advanced Templating Examples

This file demonstrates the advanced templating features introduced
in the RapidDocxBackend PR #1057.

Key points for variable configuration:
- Placeholders should include curly braces: "{variable_name}"
- For objects/arrays, use mimeType: 'json'
- For expressions on simple values, use mimeType: 'text' with usesAdvancedTemplatingEngine: True
- Boolean/number values with mimeType: 'json' work for conditionals
"""

import asyncio
import os
from turbodocx_sdk import TurboTemplate

# Configure the client
TurboTemplate.configure(
    api_key=os.environ.get("TURBODOCX_API_KEY"),
    org_id=os.environ.get("TURBODOCX_ORG_ID"),
)


async def simple_substitution():
    """
    Example 1: Simple Variable Substitution

    Template: "Dear {customer_name}, your order total is ${order_total}."
    """
    result = await TurboTemplate.generate({
        "templateId": "your-template-id",
        "name": "Simple Substitution Document",
        "description": "Basic variable substitution example",
        "variables": [
            {"placeholder": "{customer_name}", "name": "customer_name", "mimeType": "text", "value": "Foo Bar"},
            {"placeholder": "{order_total}", "name": "order_total", "mimeType": "text", "value": 1500},
            {"placeholder": "{order_date}", "name": "order_date", "mimeType": "text", "value": "2024-01-01"},
        ],
    })

    print("Document generated:", result.get("deliverableId"))


async def nested_objects():
    """
    Example 2: Nested Objects with Dot Notation

    Template: "Name: {user.name}, Email: {user.email}, Company: {user.profile.company}"
    """
    result = await TurboTemplate.generate({
        "templateId": "your-template-id",
        "name": "Nested Objects Document",
        "description": "Nested object with dot notation example",
        "variables": [
            {
                "placeholder": "{user}",
                "name": "user",
                "mimeType": "json",
                "value": {
                    "name": "Person A",
                    "email": "persona@example.com",
                    "profile": {
                        "company": "Company XYZ",
                        "title": "Role 1",
                        "location": "Test City, TS",
                    },
                },
            }
        ],
    })

    print("Document with nested data generated:", result.get("deliverableId"))


async def loops_and_arrays():
    """
    Example 3: Loops/Arrays

    Template:
    {#items}
    - {name}: {quantity} x ${price} = ${quantity * price}
    {/items}
    """
    result = await TurboTemplate.generate({
        "templateId": "your-template-id",
        "name": "Array Loops Document",
        "description": "Array loop iteration example",
        "variables": [
            {
                "placeholder": "{items}",
                "name": "items",
                "mimeType": "json",
                "value": [
                    {"name": "Item A", "quantity": 5, "price": 100, "sku": "SKU-001"},
                    {"name": "Item B", "quantity": 3, "price": 200, "sku": "SKU-002"},
                    {"name": "Item C", "quantity": 10, "price": 50, "sku": "SKU-003"},
                ],
            }
        ],
    })

    print("Document with loop generated:", result.get("deliverableId"))


async def conditionals():
    """
    Example 4: Conditionals

    Template:
    {#if is_premium}
    Premium Member Discount: {discount * 100}%
    {/if}
    {#if !is_premium}
    Become a premium member for exclusive discounts!
    {/if}
    """
    result = await TurboTemplate.generate({
        "templateId": "your-template-id",
        "name": "Conditionals Document",
        "description": "Boolean conditional example",
        "variables": [
            {
                "placeholder": "{is_premium}",
                "name": "is_premium",
                "mimeType": "json",
                "value": True,
            },
            {
                "placeholder": "{discount}",
                "name": "discount",
                "mimeType": "json",
                "value": 0.2,
            },
        ],
    })

    print("Document with conditionals generated:", result.get("deliverableId"))


async def expressions_and_calculations():
    """
    Example 5: Expressions and Calculations

    Template: "Subtotal: ${subtotal}, Tax: ${subtotal * tax_rate}, Total: ${subtotal * (1 + tax_rate)}"
    """
    result = await TurboTemplate.generate({
        "templateId": "your-template-id",
        "name": "Expressions Document",
        "description": "Arithmetic expressions example",
        "variables": [
            {
                "placeholder": "{subtotal}",
                "name": "subtotal",
                "mimeType": "text",
                "value": "1000",
                "usesAdvancedTemplatingEngine": True,
            },
            {
                "placeholder": "{tax_rate}",
                "name": "tax_rate",
                "mimeType": "text",
                "value": "0.08",
                "usesAdvancedTemplatingEngine": True,
            },
        ],
    })

    print("Document with expressions generated:", result.get("deliverableId"))


async def complex_invoice():
    """
    Example 6: Complex Invoice Example

    Combines multiple features: nested objects, loops, conditionals, expressions
    """
    result = await TurboTemplate.generate({
        "templateId": "invoice-template-id",
        "name": "Invoice - Company ABC",
        "description": "Monthly invoice",
        "variables": [
            # Customer info (nested object)
            {
                "placeholder": "{customer}",
                "name": "customer",
                "mimeType": "json",
                "value": {
                    "name": "Company ABC",
                    "email": "billing@example.com",
                    "address": {
                        "street": "123 Test Street",
                        "city": "Test City",
                        "state": "TS",
                        "zip": "00000",
                    },
                },
            },
            # Invoice metadata
            {"placeholder": "{invoice_number}", "name": "invoice_number", "mimeType": "text", "value": "INV-0000-001"},
            {"placeholder": "{invoice_date}", "name": "invoice_date", "mimeType": "text", "value": "2024-01-01"},
            {"placeholder": "{due_date}", "name": "due_date", "mimeType": "text", "value": "2024-02-01"},
            # Line items (array for loops)
            {
                "placeholder": "{items}",
                "name": "items",
                "mimeType": "json",
                "value": [
                    {
                        "description": "Service A",
                        "quantity": 40,
                        "rate": 150,
                    },
                    {
                        "description": "Service B",
                        "quantity": 1,
                        "rate": 5000,
                    },
                    {
                        "description": "Service C",
                        "quantity": 12,
                        "rate": 500,
                    },
                ],
            },
            # Tax and totals
            {
                "placeholder": "{tax_rate}",
                "name": "tax_rate",
                "mimeType": "text",
                "value": "0.08",
                "usesAdvancedTemplatingEngine": True,
            },
            # Premium customer flag
            {"placeholder": "{is_premium}", "name": "is_premium", "mimeType": "json", "value": True},
            {
                "placeholder": "{premium_discount}",
                "name": "premium_discount",
                "mimeType": "text",
                "value": "0.05",
                "usesAdvancedTemplatingEngine": True,
            },
            # Payment terms
            {"placeholder": "{payment_terms}", "name": "payment_terms", "mimeType": "text", "value": "Net 30"},
            # Notes
            {
                "placeholder": "{notes}",
                "name": "notes",
                "mimeType": "text",
                "value": "Thank you for your business!",
            },
        ],
    })

    print("Complex invoice generated:", result.get("deliverableId"))


async def using_helpers():
    """
    Example 7: Using Helper Functions

    Helper functions automatically add curly braces and set correct mimeType
    """
    result = await TurboTemplate.generate({
        "templateId": "your-template-id",
        "name": "Helper Functions Document",
        "description": "Using helper functions example",
        "variables": [
            # Simple variable - helper adds {} and sets mimeType
            TurboTemplate.create_simple_variable("title", "Quarterly Report"),
            # Nested object - helper sets mimeType: 'json' and usesAdvancedTemplatingEngine: True
            TurboTemplate.create_nested_variable(
                "company",
                {
                    "name": "Company XYZ",
                    "headquarters": "Test Location",
                    "employees": 500,
                },
            ),
            # Loop variable - helper sets mimeType: 'json' and usesAdvancedTemplatingEngine: True
            TurboTemplate.create_loop_variable(
                "departments",
                [
                    {"name": "Dept A", "headcount": 200},
                    {"name": "Dept B", "headcount": 150},
                    {"name": "Dept C", "headcount": 100},
                ],
            ),
            # Conditional - helper sets usesAdvancedTemplatingEngine: True
            TurboTemplate.create_conditional_variable("show_financials", True),
            # Image - helper sets mimeType: 'image'
            TurboTemplate.create_image_variable(
                "company_logo", "https://example.com/logo.png"
            ),
        ],
    })

    print("Document with helpers generated:", result.get("deliverableId"))


def variable_validation():
    """
    Example 8: Variable Validation
    """
    # Valid variable with proper configuration
    valid_variable = {
        "placeholder": "{user}",
        "name": "user",
        "mimeType": "json",
        "value": {"firstName": "Foo", "email": "foo@example.com"},
    }

    validation1 = TurboTemplate.validate_variable(valid_variable)
    print("Valid variable:", validation1["isValid"])  # True

    # Variable missing placeholder
    invalid_variable = {
        "name": "test",
        "value": "test",
    }

    validation2 = TurboTemplate.validate_variable(invalid_variable)
    print("Invalid variable errors:", validation2.get("errors"))

    # Variable with warnings (array without json mimeType)
    warning_variable = {
        "placeholder": "{items}",
        "name": "items",
        "value": [1, 2, 3],
    }

    validation3 = TurboTemplate.validate_variable(warning_variable)
    print("Variable warnings:", validation3.get("warnings"))


async def main():
    """Run examples"""
    print("TurboTemplate Advanced Templating Examples\n")

    try:
        # Uncomment the examples you want to run:
        # await simple_substitution()
        # await nested_objects()
        # await loops_and_arrays()
        # await conditionals()
        # await expressions_and_calculations()
        # await complex_invoice()
        # await using_helpers()
        # variable_validation()

        print("\nAll examples completed successfully!")
    except Exception as error:
        print("Error running examples:", error)


if __name__ == "__main__":
    # Uncomment to run
    # asyncio.run(main())
    pass
