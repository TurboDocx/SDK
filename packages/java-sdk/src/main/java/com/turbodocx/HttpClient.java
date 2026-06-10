package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import okhttp3.*;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

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
    private final String senderEmail;
    private final String senderName;
    private final Gson gson;

    public HttpClient(String baseUrl, String apiKey, String accessToken, String orgId, String senderEmail, String senderName) {
        this(baseUrl, apiKey, accessToken, orgId, senderEmail, senderName, 60, 120, 60);
    }

    public HttpClient(String baseUrl, String apiKey, String accessToken, String orgId, String senderEmail, String senderName,
                       int connectTimeoutSeconds, int readTimeoutSeconds, int writeTimeoutSeconds) {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(connectTimeoutSeconds, TimeUnit.SECONDS)
                .readTimeout(readTimeoutSeconds, TimeUnit.SECONDS)
                .writeTimeout(writeTimeoutSeconds, TimeUnit.SECONDS)
                .build();
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/$", "") : DEFAULT_BASE_URL;
        this.apiKey = apiKey;
        this.accessToken = accessToken;
        this.orgId = orgId;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.gson = new GsonBuilder()
                .registerTypeAdapter(int.class, new FlexIntAdapter())
                .registerTypeAdapter(Integer.class, new FlexIntAdapter())
                .create();
    }

    /**
     * Get the sender email configuration
     */
    public String getSenderEmail() {
        return senderEmail;
    }

    /**
     * Get the sender name configuration
     */
    public String getSenderName() {
        return senderName;
    }

    /**
     * Get the underlying OkHttpClient for inspection (package-private).
     */
    OkHttpClient getOkHttpClient() {
        return client;
    }

    /**
     * Shut down the underlying OkHttpClient's connection pool and dispatcher.
     */
    public void close() {
        client.dispatcher().executorService().shutdown();
        client.connectionPool().evictAll();
        okhttp3.Cache cache = client.cache();
        if (cache != null) {
            try { cache.close(); } catch (IOException ignored) { }
        }
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

    public <T> T get(String path, Map<String, Object> queryParams, Class<T> responseClass) throws IOException {
        String url = buildUrl(path, queryParams);
        Request request = new Request.Builder()
                .url(url)
                .headers(buildHeaders())
                .get()
                .build();

        return execute(request, responseClass);
    }

    public <T> T get(String path, Map<String, Object> queryParams, Type responseType) throws IOException {
        String url = buildUrl(path, queryParams);
        Request request = new Request.Builder()
                .url(url)
                .headers(buildHeaders())
                .get()
                .build();

        return execute(request, responseType);
    }

    public <T> T get(String path, Type responseType) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .get()
                .build();

        return execute(request, responseType);
    }

    public <T> T post(String path, Object body, Class<T> responseClass) throws IOException {
        RequestBody requestBody = body != null
                ? RequestBody.create(gson.toJson(body), JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(requestBody)
                .build();

        return execute(request, responseClass);
    }

    public <T> T post(String path, Object body, Type responseType) throws IOException {
        RequestBody requestBody = body != null
                ? RequestBody.create(gson.toJson(body), JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(requestBody)
                .build();

        return execute(request, responseType);
    }

    public <T> T patch(String path, Object body, Class<T> responseClass) throws IOException {
        RequestBody requestBody = body != null
                ? RequestBody.create(gson.toJson(body), JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .patch(requestBody)
                .build();

        return execute(request, responseClass);
    }

    public <T> T patch(String path, Object body, Type responseType) throws IOException {
        RequestBody requestBody = body != null
                ? RequestBody.create(gson.toJson(body), JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .patch(requestBody)
                .build();

        return execute(request, responseType);
    }

    /**
     * PATCH with a pre-serialized JSON string body.
     * Use this when the body has already been serialized (e.g., to preserve explicit nulls
     * that default Gson would drop).
     */
    public <T> T patchRawJson(String path, String jsonBody, Type responseType) throws IOException {
        RequestBody requestBody = jsonBody != null
                ? RequestBody.create(jsonBody, JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .patch(requestBody)
                .build();

        return execute(request, responseType);
    }

    /**
     * POST with a pre-serialized JSON string body.
     * Use this when the body has already been serialized (e.g., to preserve an explicit null
     * that default Gson would drop — see {@code TurboQuote.addLineItems} custom line items).
     */
    public <T> T postRawJson(String path, String jsonBody, Type responseType) throws IOException {
        RequestBody requestBody = jsonBody != null
                ? RequestBody.create(jsonBody, JSON)
                : RequestBody.create("{}", JSON);

        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(requestBody)
                .build();

        return execute(request, responseType);
    }

    public <T> T delete(String path, Class<T> responseClass) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .delete()
                .build();

        return execute(request, responseClass);
    }

    public <T> T postFormData(String path, MultipartBody body, Class<T> responseClass) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(body)
                .build();

        return execute(request, responseClass);
    }

    public <T> T postFormData(String path, MultipartBody body, Type responseType) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .post(body)
                .build();

        return execute(request, responseType);
    }

    public <T> T patchFormData(String path, MultipartBody body, Class<T> responseClass) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .patch(body)
                .build();

        return execute(request, responseClass);
    }

    public <T> T patchFormData(String path, MultipartBody body, Type responseType) throws IOException {
        Request request = new Request.Builder()
                .url(baseUrl + path)
                .headers(buildHeaders())
                .patch(body)
                .build();

        return execute(request, responseType);
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
        return execute(request, (Type) responseClass);
    }

    @SuppressWarnings("unchecked")
    private <T> T execute(Request request, Type responseType) throws IOException {
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                handleError(response);
            }

            String responseBody = response.body() != null ? response.body().string() : "";

            // Parse to JsonElement for smart unwrap + normalization
            JsonElement parsed = gson.fromJson(responseBody, JsonElement.class);

            // Smart unwrapping: if response has ONLY "data" key, extract it
            // This handles backend responses that wrap data in { "data": { ... } }
            if (parsed != null && parsed.isJsonObject()) {
                JsonObject jsonObj = parsed.getAsJsonObject();
                if (jsonObj.has("data") && jsonObj.size() == 1) {
                    parsed = jsonObj.get("data");
                }
            }

            // Normalize MySQL type coercion (tinyint booleans, decimal strings)
            parsed = ResponseNormalizer.normalize(parsed);

            // Deserialize to target type
            return gson.fromJson(parsed, responseType);
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

    /**
     * Gson TypeAdapter that handles both numeric (0/1) and boolean (true/false)
     * values for int fields. MySQL returns tinyint(1) as 0/1 but some contexts
     * may send true/false booleans.
     */
    private static class FlexIntAdapter extends TypeAdapter<Integer> {
        @Override
        public void write(JsonWriter out, Integer value) throws IOException {
            if (value == null) {
                out.nullValue();
            } else {
                out.value(value);
            }
        }

        @Override
        public Integer read(JsonReader in) throws IOException {
            JsonToken token = in.peek();
            switch (token) {
                case NUMBER:
                    return in.nextInt();
                case BOOLEAN:
                    return in.nextBoolean() ? 1 : 0;
                case NULL:
                    in.nextNull();
                    return 0;
                default:
                    throw new IOException("Expected NUMBER or BOOLEAN but was " + token);
            }
        }
    }

    /**
     * Build a URL with query parameters.
     * Supports String values, List&lt;String&gt; values (repeated keys), and null values (skipped).
     */
    private String buildUrl(String path, Map<String, Object> queryParams) {
        if (queryParams == null || queryParams.isEmpty()) {
            return baseUrl + path;
        }

        HttpUrl.Builder urlBuilder = HttpUrl.parse(baseUrl + path).newBuilder();
        for (Map.Entry<String, Object> entry : queryParams.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value == null) continue;
            if (value instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> list = (List<String>) value;
                for (String item : list) {
                    urlBuilder.addQueryParameter(key, item);
                }
            } else {
                urlBuilder.addQueryParameter(key, value.toString());
            }
        }
        return urlBuilder.build().toString();
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
