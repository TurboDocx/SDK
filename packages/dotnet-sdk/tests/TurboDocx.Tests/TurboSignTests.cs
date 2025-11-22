using System.Text.Json;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;
using Xunit;

namespace TurboDocx.Tests;

public class TurboSignTests : IDisposable
{
    private readonly WireMockServer _server;
    private readonly TurboDocxClient _client;

    public TurboSignTests()
    {
        _server = WireMockServer.Start();
        _client = new TurboDocxClient("test-api-key", _server.Url);
    }

    public void Dispose()
    {
        _client.Dispose();
        _server.Dispose();
    }

    [Fact]
    public async Task PrepareForReview_WithFileUrl_ReturnsDocumentId()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-review")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new
                    {
                        documentId = "doc-123",
                        status = "review_ready",
                        previewUrl = "https://preview.example.com/doc-123"
                    }
                })));

        var result = await _client.TurboSign.PrepareForReviewAsync(new PrepareForReviewRequest
        {
            FileLink = "https://storage.example.com/contract.pdf",
            Recipients = new[]
            {
                new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 }
            },
            Fields = new[]
            {
                new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 }
            }
        });

        Assert.Equal("doc-123", result.DocumentId);
        Assert.Equal("review_ready", result.Status);
        Assert.Equal("https://preview.example.com/doc-123", result.PreviewUrl);
    }

    [Fact]
    public async Task PrepareForReview_WithDeliverableId_ReturnsDocumentId()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-review")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new { documentId = "doc-456", status = "review_ready" }
                })));

        var result = await _client.TurboSign.PrepareForReviewAsync(new PrepareForReviewRequest
        {
            DeliverableId = "deliverable-abc",
            Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
            Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
        });

        Assert.Equal("doc-456", result.DocumentId);
    }

    [Fact]
    public async Task PrepareForSigningSingle_SendsAndReturnsSignUrl()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-signing")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new
                    {
                        documentId = "doc-123",
                        status = "sent",
                        recipients = new[]
                        {
                            new
                            {
                                id = "rec-1",
                                name = "John Doe",
                                email = "john@example.com",
                                status = "pending",
                                signUrl = "https://sign.example.com/rec-1"
                            }
                        }
                    }
                })));

        var result = await _client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
        {
            FileLink = "https://storage.example.com/contract.pdf",
            Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
            Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
        });

        Assert.Equal("doc-123", result.DocumentId);
        Assert.Equal("sent", result.Status);
        Assert.Single(result.Recipients);
        Assert.Equal("https://sign.example.com/rec-1", result.Recipients[0].SignUrl);
    }

    [Fact]
    public async Task GetStatus_ReturnsDocumentStatus()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/documents/doc-123/status")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new
                    {
                        documentId = "doc-123",
                        status = "pending",
                        name = "Test Document",
                        recipients = new[]
                        {
                            new { id = "rec-1", name = "John Doe", email = "john@example.com", status = "pending" }
                        },
                        createdAt = "2024-01-01T00:00:00Z",
                        updatedAt = "2024-01-01T00:00:00Z"
                    }
                })));

        var result = await _client.TurboSign.GetStatusAsync("doc-123");

        Assert.Equal("doc-123", result.DocumentId);
        Assert.Equal("pending", result.Status);
        Assert.Equal("Test Document", result.Name);
    }

    [Fact]
    public async Task Download_ReturnsPdfBytes()
    {
        var expectedContent = new byte[] { 0x25, 0x50, 0x44, 0x46 }; // %PDF

        _server
            .Given(Request.Create()
                .WithPath("/turbosign/documents/doc-123/download")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/pdf")
                .WithBody(expectedContent));

        var result = await _client.TurboSign.DownloadAsync("doc-123");

        Assert.Equal(expectedContent, result);
    }

    [Fact]
    public async Task VoidDocument_ReturnsVoidedStatus()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/documents/doc-123/void")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new
                    {
                        documentId = "doc-123",
                        status = "voided",
                        voidedAt = "2024-01-01T12:00:00Z"
                    }
                })));

        var result = await _client.TurboSign.VoidDocumentAsync("doc-123", "Document needs revision");

        Assert.Equal("doc-123", result.DocumentId);
        Assert.Equal("voided", result.Status);
    }

    [Fact]
    public async Task ResendEmail_ReturnsConfirmation()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/documents/doc-123/resend-email")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new
                    {
                        documentId = "doc-123",
                        message = "Emails resent successfully",
                        resentAt = "2024-01-01T12:00:00Z"
                    }
                })));

        var result = await _client.TurboSign.ResendEmailAsync("doc-123", new[] { "rec-1", "rec-2" });

        Assert.Contains("resent", result.Message.ToLower());
    }

    [Fact]
    public async Task ApiError_ThrowsTurboDocxException()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/documents/invalid-doc/status")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(404)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    message = "Document not found",
                    code = "DOCUMENT_NOT_FOUND"
                })));

        var exception = await Assert.ThrowsAsync<TurboDocxException>(
            () => _client.TurboSign.GetStatusAsync("invalid-doc"));

        Assert.Equal(404, exception.StatusCode);
        Assert.Equal("Document not found", exception.Message);
        Assert.Equal("DOCUMENT_NOT_FOUND", exception.Code);
    }

    [Fact]
    public void Client_WithoutApiKey_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new TurboDocxClient(new TurboDocxClientConfig()));
    }

    [Fact]
    public void Client_WithCustomBaseUrl_Configures()
    {
        using var client = new TurboDocxClient(new TurboDocxClientConfig
        {
            ApiKey = "test-api-key",
            BaseUrl = "https://custom-api.example.com"
        });
        Assert.NotNull(client);
        Assert.NotNull(client.TurboSign);
    }

    [Fact]
    public async Task PrepareForReview_WithTemplateId_ReturnsDocumentId()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-review")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new { documentId = "doc-template", status = "review_ready" }
                })));

        var result = await _client.TurboSign.PrepareForReviewAsync(new PrepareForReviewRequest
        {
            TemplateId = "template-xyz",
            Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
            Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
        });

        Assert.Equal("doc-template", result.DocumentId);
    }

    [Fact]
    public async Task PrepareForReview_WithOptionalFields_IncludesAllFields()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-review")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new { documentId = "doc-789", status = "review_ready" }
                })));

        var result = await _client.TurboSign.PrepareForReviewAsync(new PrepareForReviewRequest
        {
            FileLink = "https://example.com/doc.pdf",
            Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
            Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } },
            DocumentName = "Test Contract",
            DocumentDescription = "A test contract",
            SenderName = "Sales Team",
            SenderEmail = "sales@company.com",
            CcEmails = new[] { "admin@company.com", "legal@company.com" }
        });

        Assert.Equal("doc-789", result.DocumentId);
    }

    [Fact]
    public async Task PrepareForReview_WithFileUpload_ReturnsDocumentId()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-review")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new { documentId = "doc-upload", status = "review_ready" }
                })));

        var result = await _client.TurboSign.PrepareForReviewAsync(new PrepareForReviewRequest
        {
            File = new byte[] { 0x25, 0x50, 0x44, 0x46 },
            FileName = "contract.pdf",
            Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
            Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
        });

        Assert.Equal("doc-upload", result.DocumentId);
    }

    [Fact]
    public async Task PrepareForSigningSingle_WithFileUpload_ReturnsDocumentId()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-signing")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    data = new { documentId = "doc-upload", status = "sent", recipients = Array.Empty<object>() }
                })));

        var result = await _client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
        {
            File = new byte[] { 0x25, 0x50, 0x44, 0x46 },
            FileName = "contract.pdf",
            Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
            Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
        });

        Assert.Equal("doc-upload", result.DocumentId);
    }

    [Fact]
    public async Task ValidationError_ThrowsTurboDocxException()
    {
        _server
            .Given(Request.Create()
                .WithPath("/turbosign/single/prepare-for-signing")
                .UsingPost())
            .RespondWith(Response.Create()
                .WithStatusCode(400)
                .WithHeader("Content-Type", "application/json")
                .WithBody(JsonSerializer.Serialize(new
                {
                    message = "Validation failed: Invalid email format",
                    code = "VALIDATION_ERROR"
                })));

        var exception = await Assert.ThrowsAsync<TurboDocxException>(
            () => _client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
            {
                FileLink = "https://example.com/doc.pdf",
                Recipients = new[] { new Recipient { Name = "Test", Email = "invalid-email", Order = 1 } },
                Fields = Array.Empty<Field>()
            }));

        Assert.Equal(400, exception.StatusCode);
        Assert.Contains("Validation", exception.Message);
    }
}
