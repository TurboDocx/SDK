# Contributing to TurboDocx SDKs

Thank you for your interest in contributing to TurboDocx SDKs! This document provides guidelines and instructions for contributing.

## Repository Structure

This is a multi-language SDK repository. Each SDK is independent and located in its own directory:

```
packages/
├── js-sdk/        # JavaScript/TypeScript SDK
├── py-sdk/        # Python SDK
├── go-sdk/        # Go SDK
├── dotnet-sdk/    # .NET SDK
├── java-sdk/      # Java SDK
└── ruby-sdk/      # Ruby SDK
```

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SDK.git
   cd SDK
   ```
3. **Navigate to the SDK** you want to work on:
   ```bash
   cd packages/<sdk-name>
   ```
4. **Install dependencies** (see SDK-specific instructions below)
5. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## SDK-Specific Setup

### JavaScript SDK

```bash
cd packages/js-sdk
npm install
npm run build
npm test
```

### Python SDK

```bash
cd packages/py-sdk
pip install -e ".[dev]"
pytest -v
```

### Go SDK

```bash
cd packages/go-sdk
go mod download
go test -v ./...
```

### .NET SDK

```bash
cd packages/dotnet-sdk
dotnet restore
dotnet build
dotnet test
```

### Java SDK

```bash
cd packages/java-sdk
mvn test
```

### Ruby SDK

```bash
cd packages/ruby-sdk
bundle install
bundle exec rspec
```

## Development Guidelines

### Test-Driven Development (TDD)

We follow TDD practices. When adding new features:

1. **Write tests first** that describe the expected behavior
2. **Run tests** to confirm they fail
3. **Implement the feature** to make tests pass
4. **Refactor** if needed while keeping tests green

### Test Parity

All SDKs should maintain feature parity. If you add a new operation:

1. Implement it in your target SDK with tests
2. Consider opening issues for other SDKs to add the same feature
3. The goal is for all SDKs to have equivalent functionality

### Code Style

- **JavaScript/TypeScript**: Follow existing code style, use TypeScript types
- **Python**: Follow PEP 8, use type hints
- **Go**: Follow standard Go conventions, run `go fmt`
- **C#**: Follow Microsoft C# conventions
- **Java**: Follow standard Java conventions
- **Ruby**: Follow Ruby style guide

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add document template support to TurboSign
fix: handle null response in getStatus
docs: update README with new examples
test: add tests for validation errors
refactor: simplify HTTP client error handling
```

## Pull Request Process

1. **Ensure all tests pass** in CI
2. **Update documentation** if adding new features
3. **Keep PRs focused** - one feature or fix per PR
4. **Describe your changes** in the PR description
5. **Link related issues** if applicable

### PR Title Format

```
[SDK] Brief description

Examples:
[js-sdk] Add batch document signing
[py-sdk] Fix timeout handling in HTTP client
[go-sdk] Update to Go 1.22
```

## Adding a New SDK

If you'd like to add support for a new language:

1. Create a new directory: `packages/<language>-sdk/`
2. Implement the TurboSign client with these operations:
   - `prepareForReview`
   - `prepareForSigningSingle`
   - `getStatus`
   - `download`
   - `voidDocument`
   - `resendEmail`
3. Write 16 tests matching the test parity of existing SDKs
4. Add CI workflow in `.github/workflows/`
5. Add publish workflow for the language's package manager
6. Create a README with installation and usage instructions

## Reporting Issues

When reporting issues, please include:

- SDK name and version
- Language/runtime version
- Steps to reproduce
- Expected vs actual behavior
- Error messages or stack traces

## Questions?

- Open a [GitHub Issue](https://github.com/TurboDocx/SDK/issues) for bugs or feature requests
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
