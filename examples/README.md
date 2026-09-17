# TurboDocx examples

Runnable, self-contained examples that show a full integration end to end (beyond the per-language
snippets in each `packages/<lang>-sdk/examples/`).

| Example | What it shows |
|---|---|
| [`embedded-web-app`](./embedded-web-app) | A host web-app that **embeds TurboSign signing** in an iframe: collects the signer's name + email, verifies with **email OTP**, mints the signing URL server-side with the SDK, and completes via the `turbosign:completed` postMessage. The completed copy is emailed to the signer. |
| [`partner-preferences`](./partner-preferences) | Reading and setting a partner/customer organization's preferences (JS + Python). |

Each example has its own README with run instructions and prerequisites.
