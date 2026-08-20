# Quote rename & duplicate naming — PHP example

A small, self-contained app that asserts TurboQuote's **naming** contract against a live org.
It creates its own company, contact and quotes, checks each behaviour, then deletes everything
it made.

## What it checks

| Row | Behaviour |
|-----|-----------|
| S20 / S21 | `name` is trimmed on create and on update |
| S44 | interior whitespace is preserved — trimming is not normalising |
| S31 | unicode and emoji round-trip unchanged |
| S22 / S24 / S25 | whitespace-only, tab/newline-only, and empty names are rejected with a `400` |
| S26 / S27 | 255 characters is accepted; 256 is rejected |
| S28 | 255 characters wrapped in whitespace is accepted — **trim runs before the length check** |
| S2 | a draft can be renamed |
| S23a / S23b | a rejected rename returns `400` **and** leaves the stored name untouched |
| S3 / S13 | the copy is named `Copy of <source>`, built from the source's *current* name |
| S30 | duplicating a copy genuinely stacks the prefix (a renewal does not) |
| S29 | a copy of a 255-character name is truncated to 255, so the insert cannot overflow |
| S72 | a **sent** quote refuses a rename (opt-in — see below) |

Row ids match `docs/QUOTE_RENAME_SDK_TEST_PLAN.md`, so a failure here can be quoted straight
into that plan.

## Running it

```bash
export TURBODOCX_API_KEY=TDX-your-key
export TURBODOCX_ORG_ID=your-org-uuid
# optional — defaults to https://api.turbodocx.com
export TURBODOCX_BASE_URL=https://api.turbodocx.com
composer install
php examples/quote-rename/index.php
```

The process exits **non-zero** if any check fails, so it drops straight into CI.

## The send check is opt-in

`S72` sends a quote, which needs an org whose quote template has a **sender name and email**
set — without them the API returns `400 SenderEmailRequired` for an unrelated reason and the
check would be misleading. It is skipped by default and reported as `SKIP`, never as a pass.
To include it:

```bash
RUN_SEND_CHECKS=1 php examples/quote-rename/index.php
```

Note that sending is **not** reversible — the example deletes the quote afterwards, but a real
signature request will have been dispatched. Use a disposable org.
