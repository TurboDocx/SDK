using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TurboDocx;

/// <summary>
/// HTTP client for TurboDocx API requests
/// </summary>
internal class HttpClient : IDisposable
{
    private readonly System.Net.Http.HttpClient _client;
    private readonly TurboDocxClientConfig _config;
    private readonly string _baseUrl;
    private bool _disposed;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public HttpClient(TurboDocxClientConfig config)
    {
        _config = config;
        _baseUrl = config.BaseUrl ?? "https://api.turbodocx.com";
        _client = new System.Net.Http.HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    private void SetHeaders(HttpRequestMessage request, bool includeContentType = true)
    {
        if (includeContentType)
        {
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        if (!string.IsNullOrEmpty(_config.AccessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _config.AccessToken);
        }
        else if (!string.IsNullOrEmpty(_config.ApiKey))
        {
            request.Headers.Add("X-API-Key", _config.ApiKey);
        }
    }

    private async Task HandleErrorResponse(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        string message = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}";
        string? code = null;

        try
        {
            var errorData = JsonSerializer.Deserialize<ErrorResponse>(content, JsonOptions);
            if (errorData != null)
            {
                message = errorData.Message ?? errorData.Error ?? message;
                code = errorData.Code;
            }
        }
        catch
        {
            // Use default message if parsing fails
        }

        throw new TurboDocxException(message, (int)response.StatusCode, code);
    }

    public async Task<T> GetAsync<T>(string path, CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, _baseUrl + path);
        SetHeaders(request);

        var response = await _client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            await HandleErrorResponse(response);
        }

        var result = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
        return result!;
    }

    public async Task<byte[]> GetRawAsync(string path, CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, _baseUrl + path);
        SetHeaders(request, includeContentType: false);

        var response = await _client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            await HandleErrorResponse(response);
        }

        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    public async Task<T> PostAsync<T>(string path, object? data, CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, _baseUrl + path);
        SetHeaders(request);

        if (data != null)
        {
            var json = JsonSerializer.Serialize(data, JsonOptions);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        var response = await _client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            await HandleErrorResponse(response);
        }

        var result = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
        return result!;
    }

    public async Task<T> UploadFileAsync<T>(
        string path,
        byte[] file,
        string fileName,
        Dictionary<string, string>? additionalData,
        CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, _baseUrl + path);
        SetHeaders(request, includeContentType: false);

        var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(file), "file", fileName);

        if (additionalData != null)
        {
            foreach (var (key, value) in additionalData)
            {
                content.Add(new StringContent(value), key);
            }
        }

        request.Content = content;

        var response = await _client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            await HandleErrorResponse(response);
        }

        var result = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
        return result!;
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _client.Dispose();
            }
            _disposed = true;
        }
    }

    private class ErrorResponse
    {
        public string? Message { get; set; }
        public string? Error { get; set; }
        public string? Code { get; set; }
    }
}
