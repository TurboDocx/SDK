using System;

namespace TurboDocx;

/// <summary>
/// Exception thrown when TurboDocx API returns an error
/// </summary>
public class TurboDocxException : Exception
{
    /// <summary>
    /// HTTP status code
    /// </summary>
    public int StatusCode { get; }

    /// <summary>
    /// Error code from API (if provided)
    /// </summary>
    public string? Code { get; }

    /// <summary>
    /// Creates a new TurboDocxException
    /// </summary>
    public TurboDocxException(string message, int statusCode, string? code = null)
        : base(message)
    {
        StatusCode = statusCode;
        Code = code;
    }
}
