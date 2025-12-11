package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Map;

/**
 * File type detection result
 */
class FileTypeInfo {
    public final String mimeType;
    public final String extension;

    public FileTypeInfo(String mimeType, String extension) {
        this.mimeType = mimeType;
        this.extension = extension;
    }
}

/**
 * HTTP client wrapper for TurboDocx API
 */
public class HttpClient {
    private static final String DEFAULT_BASE_URL = "https://api.turbodocx.com";
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    /**
     * Detect file type from magic bytes
     */
    public static FileTypeInfo detectFileType(byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length < 4) {
            return new FileTypeInfo("application/octet-stream", "bin");
        }

        // PDF: %PDF (0x25 0x50 0x44 0x46)
        if (fileBytes[0] == 0x25 && fileBytes[1] == 0x50 && fileBytes[2] == 0x44 && fileBytes[3] == 0x46) {
            return new FileTypeInfo("application/pdf", "pdf");
        }

        // ZIP-based formats (DOCX, PPTX): starts with PK (0x50 0x4B)
        if (fileBytes[0] == 0x50 && fileBytes[1] == 0x4B) {
            int headerLen = Math.min(fileBytes.length, 2000);
            String header = new String(Arrays.copyOf(fileBytes, headerLen), StandardCharsets.UTF_8);

            // PPTX contains 'ppt/' in the ZIP structure
            if (header.contains("ppt/")) {
                return new FileTypeInfo(
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    "pptx"
                );
            }

            // DOCX contains 'word/' in the ZIP structure
            if (header.contains("word/")) {
                return new FileTypeInfo(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "docx"
                );
            }

            // Default to DOCX for unknown ZIP
            return new FileTypeInfo(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "docx"
            );
        }

        // Unknown file type
        return new FileTypeInfo("application/octet-stream", "bin");
    }

    private final OkHttpClient client;
    private final String baseUrl;
    private final String apiKey;
    private final String accessToken;
    private final String orgId;
    private final Gson gson;

    public HttpClient(String baseUrl, String apiKey, String accessToken, String orgId) {
        this.client = new OkHttpClient();
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/$", "") : DEFAULT_BASE_URL;
        this.apiKey = apiKey;
        this.accessToken = accessToken;
        this.orgId = orgId;
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

    /**
     * Upload file from bytes
     */
    public <T> T uploadFile(String path, byte[] file, String fileName, Map<String, String> formData, Class<T> responseClass) throws IOException {
        // Auto-detect filename from content if not provided
        if (fileName == null || fileName.isEmpty()) {
            FileTypeInfo detected = detectFileType(file);
            fileName = "document." + detected.extension;
        }

        // Detect MIME type from content
        FileTypeInfo detected = detectFileType(file);

        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", fileName,
                        RequestBody.create(file, MediaType.parse(detected.mimeType)));

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

    /**
     * Upload file from file path (using java.nio.file.Path)
     */
    public <T> T uploadFile(String path, Path filePath, Map<String, String> formData, Class<T> responseClass) throws IOException {
        byte[] fileBytes = Files.readAllBytes(filePath);
        String fileName = filePath.getFileName().toString();
        return uploadFile(path, fileBytes, fileName, formData, responseClass);
    }

    /**
     * Upload file from file path (using String path)
     */
    public <T> T uploadFilePath(String path, String filePath, Map<String, String> formData, Class<T> responseClass) throws IOException {
        return uploadFile(path, Paths.get(filePath), formData, responseClass);
    }

    private <T> T execute(Request request, Class<T> responseClass) throws IOException {
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                handleError(response);
            }

            String responseBody = response.body() != null ? response.body().string() : "";

            // Smart unwrapping: if response has ONLY "data" key, extract it
            // This handles backend responses that wrap data in { "data": { ... } }
            JsonObject json = gson.fromJson(responseBody, JsonObject.class);
            if (json != null && json.has("data") && json.size() == 1) {
                return gson.fromJson(json.get("data"), responseClass);
            }

            // Otherwise return as-is (for direct responses)
            return gson.fromJson(responseBody, responseClass);
        }
    }

    private void handleError(Response response) throws IOException {
        String body = response.body() != null ? response.body().string() : "";
        String message = "API Error";
        String code = null;

        try {
            JsonObject json = gson.fromJson(body, JsonObject.class);
            if (json != null) {
                // Check both "message" and "error" fields (backend uses both)
                if (json.has("message")) {
                    message = json.get("message").getAsString();
                } else if (json.has("error")) {
                    message = json.get("error").getAsString();
                }
                if (json.has("code")) {
                    code = json.get("code").getAsString();
                }
            }
        } catch (Exception e) {
            // Use default message
        }

        // Throw specific exception based on status code
        switch (response.code()) {
            case 400:
                throw new TurboDocxException.ValidationException(message, code);
            case 401:
                throw new TurboDocxException.AuthenticationException(message, code);
            case 404:
                throw new TurboDocxException.NotFoundException(message, code);
            case 429:
                throw new TurboDocxException.RateLimitException(message, code);
            default:
                throw new TurboDocxException(message, response.code(), code);
        }
    }

    private Headers buildHeaders() {
        Headers.Builder builder = new Headers.Builder();

        // API key is sent as Bearer token (backend expects Authorization header)
        if (accessToken != null && !accessToken.isEmpty()) {
            builder.add("Authorization", "Bearer " + accessToken);
        } else if (apiKey != null && !apiKey.isEmpty()) {
            builder.add("Authorization", "Bearer " + apiKey);
        }

        // Organization ID header (required by backend)
        if (orgId != null && !orgId.isEmpty()) {
            builder.add("x-rapiddocx-org-id", orgId);
        }

        return builder.build();
    }
}
