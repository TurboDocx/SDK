package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
import java.util.Map;

/**
 * HTTP client wrapper for TurboDocx API
 */
public class HttpClient {
    private static final String DEFAULT_BASE_URL = "https://api.turbodocx.com";
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private final OkHttpClient client;
    private final String baseUrl;
    private final String apiKey;
    private final String accessToken;
    private final Gson gson;

    public HttpClient(String baseUrl, String apiKey, String accessToken) {
        this.client = new OkHttpClient();
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/$", "") : DEFAULT_BASE_URL;
        this.apiKey = apiKey;
        this.accessToken = accessToken;
        this.gson = new Gson();
    }

    public <T> T get(String path, Class<T> responseClass) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .get()
                .build();

        return execute(request, responseClass);
    }

    public byte[] getRaw(String path) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .get()
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                handleError(response);
            }
            return response.body() != null ? response.body().bytes() : new byte[0];
        }
    }

    public <T> T post(String path, Object body, Class<T> responseClass) throws IOException {
        RequestBody requestBody = RequestBody.create(gson.toJson(body), JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(requestBody)
                .build();

        return execute(request, responseClass);
    }

    public <T> T uploadFile(String path, byte[] file, String fileName, Map<String, String> formData, Class<T> responseClass) throws IOException {
        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", fileName,
                        RequestBody.create(file, MediaType.parse("application/octet-stream")));

        for (Map.Entry<String, String> entry : formData.entrySet()) {
            builder.addFormDataPart(entry.getKey(), entry.getValue());
        }

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(builder.build())
                .build();

        return execute(request, responseClass);
    }

    private <T> T execute(Request request, Class<T> responseClass) throws IOException {
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                handleError(response);
            }

            String responseBody = response.body() != null ? response.body().string() : "";
            return gson.fromJson(responseBody, responseClass);
        }
    }

    private void handleError(Response response) throws IOException {
        String body = response.body() != null ? response.body().string() : "";
        String message = "API Error";
        String code = null;

        try {
            JsonObject json = gson.fromJson(body, JsonObject.class);
            if (json != null && json.has("message")) {
                message = json.get("message").getAsString();
            }
            if (json != null && json.has("code")) {
                code = json.get("code").getAsString();
            }
        } catch (Exception e) {
            // Use default message
        }

        throw new TurboDocxException(message, response.code(), code);
    }

    private Headers buildHeaders() {
        Headers.Builder builder = new Headers.Builder();

        if (apiKey != null && !apiKey.isEmpty()) {
            builder.add("X-API-Key", apiKey);
        }

        if (accessToken != null && !accessToken.isEmpty()) {
            builder.add("Authorization", "Bearer " + accessToken);
        }

        return builder.build();
    }
}
