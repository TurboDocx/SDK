package com.turbodocx;

import com.turbodocx.models.GenerateTemplateRequest;
import com.turbodocx.models.GenerateTemplateResponse;
import java.io.IOException;

/**
 * TurboTemplate provides document templating operations
 * <p>
 * Supports advanced templating features:
 * <ul>
 *     <li>Simple variable substitution: {customer_name}</li>
 *     <li>Nested objects: {user.firstName}</li>
 *     <li>Loops: {#products}...{/products}</li>
 *     <li>Conditionals: {#if condition}...{/if}</li>
 *     <li>Expressions: {price + tax}</li>
 * </ul>
 *
 * <p>Example usage:</p>
 * <pre>{@code
 * // Simple variable substitution
 * GenerateTemplateResponse response = client.turboTemplate().generate(
 *     GenerateTemplateRequest.builder()
 *         .templateId("template-uuid")
 *         .variables(Arrays.asList(
 *             TemplateVariable.simple("customer_name", "John Doe"),
 *             TemplateVariable.simple("order_total", 1500)
 *         ))
 *         .build()
 * );
 *
 * // Advanced: nested objects with dot notation
 * Map<String, Object> user = new HashMap<>();
 * user.put("firstName", "John");
 * user.put("email", "john@example.com");
 *
 * GenerateTemplateResponse response = client.turboTemplate().generate(
 *     GenerateTemplateRequest.builder()
 *         .templateId("template-uuid")
 *         .variables(Arrays.asList(
 *             TemplateVariable.advancedEngine("user", user)
 *         ))
 *         .build()
 * );
 * // Template can use: {user.firstName}, {user.email}
 *
 * // Advanced: loops with arrays
 * List<Map<String, Object>> products = Arrays.asList(
 *     Map.of("name", "Laptop", "price", 999),
 *     Map.of("name", "Mouse", "price", 29)
 * );
 *
 * GenerateTemplateResponse response = client.turboTemplate().generate(
 *     GenerateTemplateRequest.builder()
 *         .templateId("template-uuid")
 *         .variables(Arrays.asList(
 *             TemplateVariable.loop("products", products)
 *         ))
 *         .build()
 * );
 * // Template can use: {#products}{name}: ${price}{/products}
 * }</pre>
 */
public class TurboTemplate {
    private final HttpClient httpClient;

    public TurboTemplate(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    /**
     * Generate a document from a template with variables
     *
     * @param request Template ID and variables
     * @return Generated document response
     * @throws IOException if the request fails
     */
    public GenerateTemplateResponse generate(GenerateTemplateRequest request) throws IOException {
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }

        return httpClient.post("/v1/deliverable", request, GenerateTemplateResponse.class);
    }
}
