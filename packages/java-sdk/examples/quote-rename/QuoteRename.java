/**
 * TurboQuote Example: Quote Renaming & Duplicate Naming
 *
 * A small, self-contained app that asserts the naming contract documented in the
 * TurboQuote Java SDK reference. It creates everything it needs and cleans up after itself.
 *
 * What it proves:
 *   - name is trimmed on createQuote and updateQuote; whitespace-only is a 400
 *   - the 255-character limit is applied AFTER trimming
 *   - duplicateQuote names the copy "Copy of <source>", truncated to 255
 *   - renaming is draft-only — a sent quote refuses the rename
 *
 * Row ids (S20, S29, ...) refer to docs/QUOTE_RENAME_SDK_TEST_PLAN.md, so a failure here
 * can be quoted straight into that plan.
 *
 * Send-dependent checks (S72) need an org whose quote template has a sender name + email.
 * They are skipped unless RUN_SEND_CHECKS=1, and reported as skipped rather than passed.
 *
 * Required env vars:
 *   TURBODOCX_API_KEY   - your TDX- API key
 *   TURBODOCX_ORG_ID    - your organization UUID
 */

package examples;

import com.turbodocx.TurboQuoteClient;
import com.turbodocx.TurboQuote;
import com.turbodocx.TurboDocxException;
import com.turbodocx.models.quote.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class QuoteRename {

    private static final List<String[]> RESULTS = new ArrayList<>();

    private static void record(String id, String description, boolean passed, String detail) {
        RESULTS.add(new String[] { id, description, passed ? "pass" : "fail", detail });
        System.out.printf("  %s  %s  %s%n        %s%n", passed ? "PASS" : "FAIL", id, description, detail);
    }

    private static void skip(String id, String description, String reason) {
        RESULTS.add(new String[] { id, description, "skip", reason });
        System.out.printf("  SKIP  %s  %s%n        %s%n", id, description, reason);
    }

    /** A call that is expected to fail validation. */
    private interface FailingCall {
        void run() throws Exception;
    }

    /** Runs a call expected to fail validation and reports the status code it produced. */
    private static void expectRejection(String id, String description, FailingCall call) {
        try {
            call.run();
            record(id, description, false, "the call SUCCEEDED — a 400 was expected");
        } catch (TurboDocxException error) {
            record(id, description, error.getStatusCode() == 400,
                    String.format("status=%d message=%s", error.getStatusCode(), error.getMessage()));
        } catch (Exception error) {
            record(id, description, false, "unexpected exception: " + error);
        }
    }

    private static String repeat(String unit, int times) {
        StringBuilder builder = new StringBuilder(unit.length() * times);
        for (int index = 0; index < times; index++) {
            builder.append(unit);
        }
        return builder.toString();
    }

    public static void main(String[] args) {
        // baseUrl is set explicitly: HttpClient defaults it to the production host and does not
        // read TURBODOCX_BASE_URL itself, so without this the example would silently run against
        // production — and it creates and deletes real records.
        String baseUrl = System.getenv("TURBODOCX_BASE_URL");

        TurboQuoteClient client = new TurboQuoteClient.Builder()
                .apiKey(System.getenv("TURBODOCX_API_KEY"))
                .orgId(System.getenv("TURBODOCX_ORG_ID"))
                .baseUrl(baseUrl != null ? baseUrl : "https://api.turbodocx.com")
                .build();

        TurboQuote tq = client.turboQuote();

        List<String> createdQuoteIds = new ArrayList<>();
        String companyId = null;
        String contactId = null;
        int exitCode = 0;

        try {
            // ========================================================
            // 1. SET UP — a company and contact to hang quotes off
            //    (a quote's companyId is mandatory)
            // ========================================================
            System.out.println("1. Creating company and contact...\n");

            CreateCompanyContactInput contactInput = new CreateCompanyContactInput();
            contactInput.setName("Dana Reed");
            contactInput.setEmail("dana@rename-example.example.com");

            CreateCompanyRequest companyReq = new CreateCompanyRequest();
            companyReq.setName("Rename Example Co " + System.currentTimeMillis());
            companyReq.setCountry("US");
            companyReq.setContacts(Arrays.asList(contactInput));

            Company company = tq.createCompany(companyReq);
            companyId = company.getId();

            CreateContactRequest contactReq = new CreateContactRequest();
            contactReq.setName("Dana Reed");
            contactReq.setCompanyId(companyId);
            contactReq.setEmail("dana@rename-example.example.com");

            Contact contact = tq.createContact(contactReq);
            contactId = contact.getId();

            final String finalCompanyId = companyId;
            final String finalContactId = contactId;

            // ========================================================
            // 2. TRIMMING ON CREATE
            // ========================================================
            System.out.println("\n2. Trimming on create\n");

            Quote padded = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId, "  Acme Q3  ");
            record("S20", "createQuote trims leading/trailing whitespace",
                    "Acme Q3".equals(padded.getName()), "name=\"" + padded.getName() + "\"");

            Quote interior = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId, "Acme  Corp");
            record("S44", "interior whitespace is preserved (trim is not a normalise)",
                    "Acme  Corp".equals(interior.getName()), "name=\"" + interior.getName() + "\"");

            Quote unicode = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId, "案件 🚀 Ünïcode");
            record("S31", "unicode and emoji survive round-trip",
                    "案件 🚀 Ünïcode".equals(unicode.getName()), "name=\"" + unicode.getName() + "\"");

            expectRejection("S22", "whitespace-only name is rejected on create",
                    () -> rawCreate(tq, finalCompanyId, finalContactId, "   "));
            expectRejection("S24", "tab/newline-only name is rejected on create",
                    () -> rawCreate(tq, finalCompanyId, finalContactId, "\t\n"));
            expectRejection("S25", "empty name is rejected on create",
                    () -> rawCreate(tq, finalCompanyId, finalContactId, ""));

            // ========================================================
            // 3. LENGTH BOUNDARIES — the limit applies AFTER trimming
            // ========================================================
            System.out.println("\n3. Length boundaries\n");

            Quote atLimit = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId, repeat("A", 255));
            record("S26", "255 characters is accepted (inclusive maximum)",
                    atLimit.getName().length() == 255, "length=" + atLimit.getName().length());

            expectRejection("S27", "256 characters is rejected",
                    () -> rawCreate(tq, finalCompanyId, finalContactId, repeat("A", 256)));

            Quote paddedToLimit = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId,
                    "  " + repeat("B", 255) + "  ");
            record("S28", "255 chars wrapped in whitespace is accepted — trim runs before the length check",
                    paddedToLimit.getName().length() == 255, "length=" + paddedToLimit.getName().length());

            // ========================================================
            // 4. RENAMING A DRAFT
            // ========================================================
            System.out.println("\n4. Renaming a draft\n");

            Quote source = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId, "Acme Q3");

            UpdateQuoteRequest firstRename = new UpdateQuoteRequest();
            firstRename.setName("Acme Q3 — Revised");
            Quote renamed = tq.updateQuote(source.getId(), firstRename);
            record("S2", "updateQuote renames a draft",
                    "Acme Q3 — Revised".equals(renamed.getName()), "name=\"" + renamed.getName() + "\"");

            UpdateQuoteRequest paddedRename = new UpdateQuoteRequest();
            paddedRename.setName("  Acme Q3 — Final  ");
            Quote trimmed = tq.updateQuote(source.getId(), paddedRename);
            record("S21", "updateQuote trims the new name",
                    "Acme Q3 — Final".equals(trimmed.getName()), "name=\"" + trimmed.getName() + "\"");

            final String sourceId = source.getId();
            expectRejection("S23a", "whitespace-only name is rejected on update", () -> {
                UpdateQuoteRequest blank = new UpdateQuoteRequest();
                blank.setName("   ");
                tq.updateQuote(sourceId, blank);
            });

            Quote afterRejection = tq.getQuote(sourceId);
            record("S23b", "the rejected rename left the stored name untouched",
                    "Acme Q3 — Final".equals(afterRejection.getName()),
                    "name=\"" + afterRejection.getName() + "\"");

            // ========================================================
            // 5. DUPLICATE NAMING
            // ========================================================
            System.out.println("\n5. Duplicate naming\n");

            Quote copy = tq.duplicateQuote(sourceId);
            createdQuoteIds.add(copy.getId());
            record("S3", "duplicateQuote prefixes the copy with \"Copy of \"",
                    "Copy of Acme Q3 — Final".equals(copy.getName()), "name=\"" + copy.getName() + "\"");

            record("S13", "the copy is built from the CURRENT name, not the name at creation",
                    !copy.getName().contains("Revised") && copy.getName().contains("Final"),
                    "source was renamed twice; copy=\"" + copy.getName() + "\"");

            Quote copyOfCopy = tq.duplicateQuote(copy.getId());
            createdQuoteIds.add(copyOfCopy.getId());
            record("S30", "duplicating a copy genuinely stacks the prefix (unlike a renewal)",
                    ("Copy of " + copy.getName()).equals(copyOfCopy.getName()),
                    "name=\"" + copyOfCopy.getName() + "\"");

            Quote longSource = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId, repeat("C", 255));
            Quote longCopy = tq.duplicateQuote(longSource.getId());
            createdQuoteIds.add(longCopy.getId());
            record("S29", "a copy of a 255-char name is truncated to 255, so the insert cannot overflow",
                    longCopy.getName().length() == 255 && longCopy.getName().startsWith("Copy of "),
                    "length=" + longCopy.getName().length()
                            + " prefix=\"" + longCopy.getName().substring(0, 12) + "\"");

            // ========================================================
            // 6. RENAME IS DRAFT-ONLY
            // ========================================================
            System.out.println("\n6. Rename is draft-only\n");

            if ("1".equals(System.getenv("RUN_SEND_CHECKS"))) {
                Quote toSend = createQuote(tq, createdQuoteIds, finalCompanyId, finalContactId,
                        "Sent Quote Rename Check");
                tq.sendQuote(toSend.getId());
                expectRejection("S72", "a sent quote refuses a rename", () -> {
                    UpdateQuoteRequest afterSend = new UpdateQuoteRequest();
                    afterSend.setName("Renamed After Send");
                    tq.updateQuote(toSend.getId(), afterSend);
                });
            } else {
                skip("S72", "a sent quote refuses a rename",
                        "set RUN_SEND_CHECKS=1 with a send-capable org "
                                + "(sender name + email on the org quote template)");
            }

            // ========================================================
            // 7. SUMMARY
            // ========================================================
            long passed = RESULTS.stream().filter(r -> "pass".equals(r[2])).count();
            long failed = RESULTS.stream().filter(r -> "fail".equals(r[2])).count();
            long skipped = RESULTS.stream().filter(r -> "skip".equals(r[2])).count();

            System.out.println("\n============================================================");
            System.out.printf("  %d passed · %d failed · %d skipped%n", passed, failed, skipped);
            System.out.println("============================================================\n");

            if (failed > 0) {
                System.out.println("Failed rows:");
                RESULTS.stream().filter(r -> "fail".equals(r[2]))
                        .forEach(r -> System.out.printf("  %s  %s — %s%n", r[0], r[1], r[3]));
                exitCode = 1;
            }
        } catch (Exception error) {
            System.out.println("\nFatal: " + error);
            exitCode = 1;
        } finally {
            // ========================================================
            // CLEANUP — leave the org as we found it
            // ========================================================
            System.out.println("\nCleaning up...");
            for (String quoteId : createdQuoteIds) {
                try {
                    tq.deleteQuote(quoteId);
                } catch (Exception ignored) {
                    // cleanup is best-effort
                }
            }
            if (contactId != null) {
                try {
                    tq.deleteContact(contactId);
                } catch (Exception ignored) {
                    // cleanup is best-effort
                }
            }
            if (companyId != null) {
                try {
                    tq.deleteCompany(companyId);
                } catch (Exception ignored) {
                    // cleanup is best-effort
                }
            }
            System.out.println("Done.");
        }

        System.exit(exitCode);
    }

    /** Creates a quote and remembers its id so cleanup can remove it. */
    private static Quote createQuote(TurboQuote tq, List<String> createdQuoteIds,
                                     String companyId, String contactId, String name) throws Exception {
        Quote quote = rawCreate(tq, companyId, contactId, name);
        createdQuoteIds.add(quote.getId());
        return quote;
    }

    /** Creates a quote WITHOUT tracking it — used by the rejection checks, which expect no quote. */
    private static Quote rawCreate(TurboQuote tq, String companyId, String contactId, String name)
            throws Exception {
        CreateQuoteRequest request = new CreateQuoteRequest();
        request.setName(name);
        request.setCompanyId(companyId);
        request.setContactId(contactId);
        return tq.createQuote(request);
    }
}
