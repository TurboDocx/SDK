# TurboDocx API Monorepo Scaffold (npm + PyPI)

This document defines requirements for scaffolding a **monorepo** containing:
- an **npm package** (JavaScript SDK), and
- a **PyPI package** (Python SDK),

both generated from API specs.

The repo should include path-filtered GitHub Actions workflows to lint, build, test, and publish packages independently.

---

## 1. Folder structure
```
turbodocx-apis/
  package.json          # npm workspace root
  package-lock.json
  specs/
    core.yaml
    sign.yaml
  packages/
    js-sdk/             # npm package
      package.json
      src/index.ts
    py-sdk/             # PyPI package
      pyproject.toml
      src/turbodocx_sdk/__init__.py
  .github/workflows/
    js-ci.yml
    py-ci.yml
    release-js.yml
    release-py.yml
```

---

## 2. npm workspace config (root `package.json`)
```json
{
  "name": "turbodocx-apis",
  "private": true,
  "workspaces": [
    "packages/js-sdk"
  ],
  "scripts": {
    "build": "npm run build -w packages/js-sdk",
    "lint": "echo 'add eslint here'",
    "test": "echo 'add jest here'",
    "codegen": "node tools/codegen.js"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "openapi-typescript": "^6.7.0",
    "@redocly/openapi-cli": "^1.21.0",
    "@stoplight/spectral-cli": "^6.11.1"
  }
}
```

---

## 3. JS SDK package
File: `packages/js-sdk/package.json`
```json
{
  "name": "@turbodocx/sdk",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "echo 'no tests yet'"
  }
}
```

---

## 4. Python SDK package
File: `packages/py-sdk/pyproject.toml`
```toml
[project]
name = "turbodocx-sdk"
version = "0.1.0"
description = "TurboDocx Python SDK"
requires-python = ">=3.9"
dependencies = []

[tool.hatch.build.targets.wheel]
packages = ["src/turbodocx_sdk"]
```

---

## 5. GitHub Actions Workflows (with path filters)

### `js-ci.yml`
```yaml
name: JS SDK CI
on:
  pull_request:
    paths: ["packages/js-sdk/**", "specs/**"]
  push:
    branches: [main]
    paths: ["packages/js-sdk/**", "specs/**"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build -w packages/js-sdk
```

---

### `py-ci.yml`
```yaml
name: Python SDK CI
on:
  pull_request:
    paths: ["packages/py-sdk/**", "specs/**"]
  push:
    branches: [main]
    paths: ["packages/py-sdk/**", "specs/**"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install hatch twine
      - run: cd packages/py-sdk && hatch build
```

---

### `release-js.yml`
```yaml
name: Release JS SDK
on:
  push:
    branches: [main]
    paths: ["packages/js-sdk/**"]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: "https://registry.npmjs.org"
      - run: npm install
      - run: npm run build -w packages/js-sdk
      - run: npm publish --workspace packages/js-sdk
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

### `release-py.yml`
```yaml
name: Release PyPI SDK
on:
  push:
    branches: [main]
    paths: ["packages/py-sdk/**"]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install hatch twine
      - run: cd packages/py-sdk && hatch build
      - run: python -m twine upload dist/*
        working-directory: packages/py-sdk
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}
```

---

## ✅ Requirements Recap
1. Repo root uses **npm workspaces** for JS SDK.  
2. Python SDK uses **Hatch** for builds and **Twine** for publishing.  
3. GitHub Actions:
   - `js-ci.yml` runs on JS/Spec changes.  
   - `py-ci.yml` runs on Python/Spec changes.  
   - `release-js.yml` publishes npm package when JS SDK changes merged to `main`.  
   - `release-py.yml` publishes PyPI package when Python SDK changes merged to `main`.  
4. Path filters ensure **only relevant jobs run**.  
5. Secrets required:
   - `NPM_TOKEN` for npm publish.  
   - `PYPI_TOKEN` for PyPI publish (or use OIDC trusted publishing).  
