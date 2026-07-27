package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * HTTP client for TurboDocx Partner API.
 *
 * <p>Uses partner-specific authentication (Partner API Key as Bearer token)
 * instead of the standard API key + Org ID used by {@link HttpClient}.</p>
 *
 * <p>Unlike HttpClient, this client does NOT perform smart unwrapping of
 * responses because partner API responses contain multiple top-level keys
 * (success, data, message).</p>
 */
class PartnerHttpClient {
    private static final String DEFAULT_BASE_URL = "https://api.turbodocx.com";
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private final OkHttpClient client;
    private final String baseUrl;
    private final String partnerApiKey;
    private final ClientContext clientContext;
    private final Gson gson;

    PartnerHttpClient(String baseUrl, String partnerApiKey) {
        this(baseUrl, partnerApiKey, ClientContext.autoDetect());
    }

    PartnerHttpClient(String baseUrl, String partnerApiKey, ClientContext clientContext) {
        this.clientContext = clientContext != null ? clientContext : ClientContext.autoDetect();
        this.client = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/$", "") : DEFAULT_BASE_URL;
        this.partnerApiKey = partnerApiKey;
        this.gson = new Gson();
    }

    public JsonObject get(String path) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .get()
                .build();

        return execute(request);
    }

    public JsonObject post(String path, Object body) throws IOException {
        RequestBody requestBody = body != null
                ? RequestBody.create(gson.toJson(body), JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(requestBody)
                .build();

        return execute(request);
    }

    public JsonObject patch(String path, Object body) throws IOException {
        RequestBody requestBody = body != null
                ? RequestBody.create(gson.toJson(body), JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .patch(requestBody)
                .build();

        return execute(request);
    }

    public JsonObject delete(String path) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .delete()
                .build();

        return execute(request);
    }

    private JsonObject execute(Request request) throws IOException {
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                handleError(response);
            }

            String responseBody = response.body() != null ? response.body().string() : "{}";

            // Return raw JSON — no smart unwrapping for partner responses
            return gson.fromJson(responseBody, JsonObject.class);
        }
    }

    private void handleError(Response response) throws IOException {
        String body = response.body() != null ? response.body().string() : "";
        String message = "API Error";
        String code = null;

        try {
            JsonObject json = gson.fromJson(body, JsonObject.class);
            if (json != null) {
                // Prefer the per-field validation reasons over the generic envelope message —
                // see HttpClient.extractFieldErrors.
                String fieldErrors = HttpClient.extractFieldErrors(json);

                if (fieldErrors != null) {
                    message = fieldErrors;
                } else if (json.has("message")) {
                    message = json.get("message").getAsString();
                } else if (HttpClient.extractNestedErrorMessage(json) != null) {
                    message = HttpClient.extractNestedErrorMessage(json);
                } else if (HttpClient.extractErrorString(json) != null) {
                    message = HttpClient.extractErrorString(json);
                }
                code = HttpClient.extractErrorCode(json);
            }
        } catch (Exception e) {
            // Use default message
        }

        switch (response.code()) {
            case 400:
                throw new TurboDocxException.ValidationException(message, code);
            case 401:
                throw new TurboDocxException.AuthenticationException(message, code);
            case 403:
                throw new TurboDocxException.AuthorizationException(message, code);
            case 404:
                throw new TurboDocxException.NotFoundException(message, code);
            case 409:
                throw new TurboDocxException.ConflictException(message, code);
            case 429:
                throw new TurboDocxException.RateLimitException(message, code);
            default:
                throw new TurboDocxException(message, response.code(), code);
        }
    }

    private Headers buildHeaders() {
        Headers.Builder builder = new Headers.Builder();

        // Client-context headers (User-Agent, X-Timezone, Accept-Language,
        // X-Forwarded-For, X-Device-Fingerprint) describe the calling environment
        // so the partner audit log records the canonical @turbodocx/sdk token.
        // Added first so the SDK's own protocol headers below always win over
        // caller context — matching HttpClient.buildHeaders ordering.
        for (Map.Entry<String, String> entry : ClientContext.resolveHeaders(clientContext).entrySet()) {
            builder.add(entry.getKey(), entry.getValue());
        }

        builder.add("Authorization", "Bearer " + partnerApiKey);
        builder.add("Content-Type", "application/json");

        return builder.build();
    }
}
