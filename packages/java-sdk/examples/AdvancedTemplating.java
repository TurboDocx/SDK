package examples;

import com.turbodocx.TurboDocxClient;
import com.turbodocx.TurboDocxException;
import com.turbodocx.models.*;

import java.util.*;

/**
 * TurboTemplate Advanced Templating Examples
 * <p>
 * This file demonstrates the advanced templating features introduced
 * in the RapidDocxBackend PR #1057.
 */
public class AdvancedTemplating {

    private static TurboDocxClient client;

    public static void main(String[] args) {
        // Configure the client
        client = new TurboDocxClient.Builder()
                .apiKey(System.getenv("TURBODOCX_API_KEY"))
                .orgId(System.getenv("TURBODOCX_ORG_ID"))
                .senderEmail("api@example.com")
                .build();

        // Uncomment the examples you want to run:
        // simpleSubstitution();
        // nestedObjects();
        // loopsAndArrays();
        // conditionals();
        // expressionsAndCalculations();
        // complexInvoice();
        // usingHelpers();

        System.out.println("Examples ready to run!");
    }

    /**
     * Example 1: Simple Variable Substitution
     * <p>
     * Template: "Dear {customer_name}, your order total is ${order_total}."
     */
    public static void simpleSubstitution() {
        try {
            GenerateTemplateResponse response = client.turboTemplate().generate(
                    GenerateTemplateRequest.builder()
                            .templateId("your-template-id")
                            .variables(Arrays.asList(
                                    TemplateVariable.simple("customer_name", "Person A"),
                                    TemplateVariable.simple("order_total", 1500),
                                    TemplateVariable.simple("order_date", "2024-01-15")
                            ))
                            .build()
            );

            System.out.println("Document generated: " + response.getDeliverableId());
        } catch (TurboDocxException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    /**
     * Example 2: Nested Objects with Dot Notation
     * <p>
     * Template: "Name: {user.name}, Email: {user.email}, Company: {user.profile.company}"
     */
    public static void nestedObjects() {
        try {
            Map<String, Object> profile = new HashMap<>();
            profile.put("company", "Company ABC");
            profile.put("title", "Title A");
            profile.put("location", "Test City, TS");

            Map<String, Object> user = new HashMap<>();
            user.put("name", "Person A");
            user.put("email", "persona@example.com");
            user.put("profile", profile);

            GenerateTemplateResponse response = client.turboTemplate().generate(
                    GenerateTemplateRequest.builder()
                            .templateId("your-template-id")
                            .variables(Collections.singletonList(
                                    TemplateVariable.nested("user", user)
                            ))
                            .build()
            );

            System.out.println("Document with nested data generated: " + response.getDeliverableId());
        } catch (TurboDocxException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    /**
     * Example 3: Loops/Arrays
     * <p>
     * Template:
     * {#items}
     * - {name}: {quantity} x ${price} = ${quantity * price}
     * {/items}
     */
    public static void loopsAndArrays() {
        try {
            List<Map<String, Object>> items = Arrays.asList(
                    Map.of("name", "Item A", "quantity", 5, "price", 100, "sku", "ITM-001"),
                    Map.of("name", "Item B", "quantity", 3, "price", 200, "sku", "ITM-002"),
                    Map.of("name", "Item C", "quantity", 10, "price", 50, "sku", "ITM-003")
            );

            GenerateTemplateResponse response = client.turboTemplate().generate(
                    GenerateTemplateRequest.builder()
                            .templateId("your-template-id")
                            .variables(Collections.singletonList(
                                    TemplateVariable.loop("items", items)
                            ))
                            .build()
            );

            System.out.println("Document with loop generated: " + response.getDeliverableId());
        } catch (TurboDocxException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    /**
     * Example 4: Conditionals
     * <p>
     * Template:
     * {#if is_premium}
     * Premium Member Discount: {discount * 100}%
     * {/if}
     * {#if !is_premium}
     * Become a premium member for exclusive discounts!
     * {/if}
     */
    public static void conditionals() {
        try {
            GenerateTemplateResponse response = client.turboTemplate().generate(
                    GenerateTemplateRequest.builder()
                            .templateId("your-template-id")
                            .variables(Arrays.asList(
                                    TemplateVariable.builder()
                                            .placeholder("{is_premium}")
                                            .name("is_premium")
                                            .mimeType(VariableMimeType.JSON)
                                            .value(true)
                                            .build(),
                                    TemplateVariable.builder()
                                            .placeholder("{discount}")
                                            .name("discount")
                                            .mimeType(VariableMimeType.JSON)
                                            .value(0.2)
                                            .build()
                            ))
                            .build()
            );

            System.out.println("Document with conditionals generated: " + response.getDeliverableId());
        } catch (TurboDocxException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    /**
     * Example 5: Expressions and Calculations
     * <p>
     * Template: "Subtotal: ${subtotal}, Tax: ${subtotal * tax_rate}, Total: ${subtotal * (1 + tax_rate)}"
     */
    public static void expressionsAndCalculations() {
        try {
            GenerateTemplateResponse response = client.turboTemplate().generate(
                    GenerateTemplateRequest.builder()
                            .templateId("your-template-id")
                            .variables(Arrays.asList(
                                    TemplateVariable.builder()
                                            .placeholder("{subtotal}")
                                            .name("subtotal")
                                            .mimeType(VariableMimeType.TEXT)
                                            .value("1000")
                                            .usesAdvancedTemplatingEngine(true)
                                            .build(),
                                    TemplateVariable.builder()
                                            .placeholder("{tax_rate}")
                                            .name("tax_rate")
                                            .mimeType(VariableMimeType.TEXT)
                                            .value("0.08")
                                            .usesAdvancedTemplatingEngine(true)
                                            .build()
                            ))
                            .build()
            );

            System.out.println("Document with expressions generated: " + response.getDeliverableId());
        } catch (TurboDocxException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    /**
     * Example 6: Complex Invoice Example
     * <p>
     * Combines multiple features: nested objects, loops, conditionals, expressions
     */
    public static void complexInvoice() {
        try {
            // Customer info (nested object)
            Map<String, Object> address = new HashMap<>();
            address.put("street", "123 Test Street");
            address.put("city", "Test City");
            address.put("state", "TS");
            address.put("zip", "00000");

            Map<String, Object> customer = new HashMap<>();
            customer.put("name", "Company XYZ");
            customer.put("email", "billing@companyxyz.example.com");
            customer.put("address", address);

            // Line items (array for loops)
            List<Map<String, Object>> items = Arrays.asList(
                    Map.of(
                            "description", "Service A - Type 1",
                            "quantity", 40,
                            "rate", 150
                    ),
                    Map.of(
                            "description", "Service B - Type 2",
                            "quantity", 1,
                            "rate", 5000
                    ),
                    Map.of(
                            "description", "Service C - Type 3",
                            "quantity", 12,
                            "rate", 500
                    )
            );

            GenerateTemplateResponse response = client.turboTemplate().generate(
                    GenerateTemplateRequest.builder()
                            .templateId("invoice-template-id")
                            .name("Invoice - Company XYZ")
                            .description("Monthly invoice for Company XYZ")
                            .variables(Arrays.asList(
                                    TemplateVariable.nested("customer", customer),
                                    TemplateVariable.simple("invoice_number", "INV-2024-001"),
                                    TemplateVariable.simple("invoice_date", "2024-01-15"),
                                    TemplateVariable.simple("due_date", "2024-02-14"),
                                    TemplateVariable.loop("items", items),
                                    TemplateVariable.builder()
                                            .placeholder("{tax_rate}")
                                            .name("tax_rate")
                                            .mimeType(VariableMimeType.TEXT)
                                            .value("0.08")
                                            .usesAdvancedTemplatingEngine(true)
                                            .build(),
                                    TemplateVariable.builder()
                                            .placeholder("{is_premium}")
                                            .name("is_premium")
                                            .mimeType(VariableMimeType.JSON)
                                            .value(true)
                                            .build(),
                                    TemplateVariable.builder()
                                            .placeholder("{premium_discount}")
                                            .name("premium_discount")
                                            .mimeType(VariableMimeType.TEXT)
                                            .value("0.05")
                                            .usesAdvancedTemplatingEngine(true)
                                            .build(),
                                    TemplateVariable.simple("payment_terms", "Net 30"),
                                    TemplateVariable.simple("notes", "Thank you for your business!")
                            ))
                            .build()
            );

            System.out.println("Complex invoice generated: " + response.getDeliverableId());
        } catch (TurboDocxException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    /**
     * Example 7: Using Helper Functions
     */
    public static void usingHelpers() {
        try {
            Map<String, Object> company = Map.of(
                    "name", "Company ABC",
                    "headquarters", "Test City",
                    "employees", 500
            );

            List<Map<String, Object>> departments = Arrays.asList(
                    Map.of("name", "Dept A", "headcount", 200),
                    Map.of("name", "Dept B", "headcount", 150),
                    Map.of("name", "Dept C", "headcount", 100)
            );

            GenerateTemplateResponse response = client.turboTemplate().generate(
                    GenerateTemplateRequest.builder()
                            .templateId("your-template-id")
                            .variables(Arrays.asList(
                                    TemplateVariable.simple("title", "Quarterly Report"),
                                    TemplateVariable.nested("company", company),
                                    TemplateVariable.loop("departments", departments),
                                    TemplateVariable.conditional("show_financials", true),
                                    TemplateVariable.image("company_logo", "https://example.com/logo.png")
                            ))
                            .build()
            );

            System.out.println("Document with helpers generated: " + response.getDeliverableId());
        } catch (TurboDocxException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}
