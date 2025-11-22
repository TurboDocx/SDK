using System;

namespace TurboDocx;

/// <summary>
/// Main TurboDocx API client
/// </summary>
public class TurboDocxClient : IDisposable
{
    private readonly HttpClient _httpClient;
    private bool _disposed;

    /// <summary>
    /// TurboSign module for digital signature operations
    /// </summary>
    public TurboSignClient TurboSign { get; }

    /// <summary>
    /// Creates a new TurboDocx client with the given API key
    /// </summary>
    /// <param name="apiKey">Your TurboDocx API key</param>
    /// <param name="baseUrl">Optional custom base URL</param>
    public TurboDocxClient(string apiKey, string? baseUrl = null)
        : this(new TurboDocxClientConfig { ApiKey = apiKey, BaseUrl = baseUrl })
    {
    }

    /// <summary>
    /// Creates a new TurboDocx client with custom configuration
    /// </summary>
    /// <param name="config">Client configuration</param>
    public TurboDocxClient(TurboDocxClientConfig config)
    {
        if (string.IsNullOrEmpty(config.ApiKey) && string.IsNullOrEmpty(config.AccessToken))
        {
            throw new ArgumentException("API key or access token is required");
        }

        _httpClient = new HttpClient(config);
        TurboSign = new TurboSignClient(_httpClient);
    }

    /// <summary>
    /// Disposes the client and releases resources
    /// </summary>
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
                _httpClient.Dispose();
            }
            _disposed = true;
        }
    }
}

/// <summary>
/// Configuration options for TurboDocxClient
/// </summary>
public class TurboDocxClientConfig
{
    /// <summary>
    /// TurboDocx API key
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// OAuth2 access token (alternative to ApiKey)
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// API base URL (default: https://api.turbodocx.com)
    /// </summary>
    public string? BaseUrl { get; set; }
}
