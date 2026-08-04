//go:build ignore
// +build ignore

// TurboQuote Example: Quote Renaming & Duplicate Naming
//
// A small, self-contained app that asserts the naming contract documented in
// docs/SDKs/quote-go.md. It creates everything it needs and cleans up after itself.
//
// What it proves:
//   - Name is trimmed on CreateQuote and UpdateQuote; whitespace-only is a 400
//   - the 255-character limit is applied AFTER trimming
//   - DuplicateQuote names the copy "Copy of <source>", truncated to 255
//   - renaming is draft-only — a sent quote refuses the rename
//
// Row ids (S20, S29, ...) refer to docs/QUOTE_RENAME_SDK_TEST_PLAN.md, so a failure here
// can be quoted straight into that plan.
//
// Send-dependent checks (S72) need an org whose quote template has a sender name + email.
// They are skipped unless RUN_SEND_CHECKS=1, and reported as skipped rather than passed.
//
// Usage:
//
//	TURBODOCX_API_KEY=TDX-... TURBODOCX_ORG_ID=org_... go run examples/quote-rename/main.go

package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

type checkResult struct {
	id          string
	description string
	outcome     string // "pass" | "fail" | "skip"
	detail      string
}

var results []checkResult

func record(id, description string, passed bool, detail string) {
	outcome := "fail"
	if passed {
		outcome = "pass"
	}
	results = append(results, checkResult{id, description, outcome, detail})
	fmt.Printf("  %s  %s  %s\n        %s\n", strings.ToUpper(outcome), id, description, detail)
}

func skip(id, description, reason string) {
	results = append(results, checkResult{id, description, "skip", reason})
	fmt.Printf("  SKIP  %s  %s\n        %s\n", id, description, reason)
}

// expectRejection runs a call expected to fail validation and reports the status code it produced.
func expectRejection(id, description string, call func() error) {
	err := call()
	if err == nil {
		record(id, description, false, "the call SUCCEEDED — a 400 was expected")
		return
	}
	var validationErr *turbodocx.ValidationError
	if errors.As(err, &validationErr) {
		record(id, description, validationErr.StatusCode == 400,
			fmt.Sprintf("status=%d message=%s", validationErr.StatusCode, validationErr.Message))
		return
	}
	var apiErr *turbodocx.TurboDocxError
	if errors.As(err, &apiErr) {
		record(id, description, apiErr.StatusCode == 400,
			fmt.Sprintf("status=%d message=%s", apiErr.StatusCode, apiErr.Message))
		return
	}
	record(id, description, false, fmt.Sprintf("unexpected error type: %v", err))
}

func strPtr(s string) *string { return &s }

func main() {
	os.Exit(run())
}

// run holds the whole example so the cleanup defer actually fires — os.Exit skips defers,
// so main() does nothing but forward this function's exit code.
func run() (exitCode int) {
	// Registered first, so it unwinds LAST: cleanup gets to run before we report the failure.
	defer func() {
		if recovered := recover(); recovered != nil {
			fmt.Printf("\nFatal: %v\n", recovered)
			exitCode = 1
		}
	}()

	ctx := context.Background()

	client, err := turbodocx.NewQuoteClient(turbodocx.QuoteClientConfig{
		APIKey: os.Getenv("TURBODOCX_API_KEY"),
		OrgID:  os.Getenv("TURBODOCX_ORG_ID"),
	})
	if err != nil {
		fmt.Printf("Error creating client: %v\n", err)
		return 1
	}

	var createdQuoteIDs []string
	companyID, contactID := "", ""

	// CLEANUP — leave the org as we found it.
	defer func() {
		fmt.Println("\nCleaning up...")
		for _, quoteID := range createdQuoteIDs {
			_, _ = client.DeleteQuote(ctx, quoteID) // best-effort
		}
		if contactID != "" {
			_, _ = client.DeleteContact(ctx, contactID)
		}
		if companyID != "" {
			_, _ = client.DeleteCompany(ctx, companyID)
		}
		fmt.Println("Done.")
	}()

	// --- 1. SET UP — a company and contact to hang quotes off ---
	//     (TurboQuoteHeader.companyId is NOT NULL, so this is mandatory)
	fmt.Print("1. Creating company and contact...\n\n")

	company, err := client.CreateCompany(ctx, &turbodocx.CreateCompanyRequest{
		Name:    fmt.Sprintf("Rename Example Co %d", time.Now().UnixMilli()),
		Country: strPtr("US"),
		Contacts: []turbodocx.CreateCompanyContactInput{
			{Name: "Dana Reed", Email: "dana@rename-example.test"},
		},
	})
	if err != nil {
		fmt.Printf("Error creating company: %v\n", err)
		return 1
	}
	companyID = company.ID

	contact, err := client.CreateContact(ctx, &turbodocx.CreateContactRequest{
		Name:      "Dana Reed",
		CompanyID: companyID,
		Email:     strPtr("dana@rename-example.test"),
	})
	if err != nil {
		fmt.Printf("Error creating contact: %v\n", err)
		return 1
	}
	contactID = contact.ID

	newQuote := func(name string) *turbodocx.Quote {
		quote, quoteErr := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
			Name: name, CompanyID: companyID, ContactID: contactID,
		})
		if quoteErr != nil {
			// Panics rather than returns: the cleanup defer still runs, and run()'s recover
			// turns it into a non-zero exit without every call site growing an error check.
			panic(fmt.Sprintf("creating quote %q: %v", name, quoteErr))
		}
		createdQuoteIDs = append(createdQuoteIDs, quote.ID)
		return quote
	}

	// --- 2. TRIMMING ON CREATE ---
	fmt.Print("\n2. Trimming on create\n\n")

	padded := newQuote("  Acme Q3  ")
	record("S20", "CreateQuote trims leading/trailing whitespace",
		padded.Name == "Acme Q3", fmt.Sprintf("name=%q", padded.Name))

	interior := newQuote("Acme  Corp")
	record("S44", "interior whitespace is preserved (trim is not a normalise)",
		interior.Name == "Acme  Corp", fmt.Sprintf("name=%q", interior.Name))

	unicodeQuote := newQuote("案件 🚀 Ünïcode")
	record("S31", "unicode and emoji survive round-trip",
		unicodeQuote.Name == "案件 🚀 Ünïcode", fmt.Sprintf("name=%q", unicodeQuote.Name))

	expectRejection("S22", "whitespace-only name is rejected on create", func() error {
		_, e := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
			Name: "   ", CompanyID: companyID, ContactID: contactID})
		return e
	})

	expectRejection("S24", "tab/newline-only name is rejected on create", func() error {
		_, e := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
			Name: "\t\n", CompanyID: companyID, ContactID: contactID})
		return e
	})

	expectRejection("S25", "empty name is rejected on create", func() error {
		_, e := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
			Name: "", CompanyID: companyID, ContactID: contactID})
		return e
	})

	// --- 3. LENGTH BOUNDARIES — the limit applies AFTER trimming ---
	fmt.Print("\n3. Length boundaries\n\n")

	atLimit := newQuote(strings.Repeat("A", 255))
	record("S26", "255 characters is accepted (inclusive maximum)",
		utf8.RuneCountInString(atLimit.Name) == 255,
		fmt.Sprintf("length=%d", utf8.RuneCountInString(atLimit.Name)))

	expectRejection("S27", "256 characters is rejected", func() error {
		_, e := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
			Name: strings.Repeat("A", 256), CompanyID: companyID, ContactID: contactID})
		return e
	})

	paddedToLimit := newQuote("  " + strings.Repeat("B", 255) + "  ")
	record("S28", "255 chars wrapped in whitespace is accepted — trim runs before the length check",
		utf8.RuneCountInString(paddedToLimit.Name) == 255,
		fmt.Sprintf("length=%d", utf8.RuneCountInString(paddedToLimit.Name)))

	// --- 4. RENAMING A DRAFT ---
	fmt.Print("\n4. Renaming a draft\n\n")

	source := newQuote("Acme Q3")

	renamed, err := client.UpdateQuote(ctx, source.ID, &turbodocx.UpdateQuoteRequest{
		Name: strPtr("Acme Q3 — Revised")})
	if err != nil {
		fmt.Printf("Error renaming quote: %v\n", err)
		return 1
	}
	record("S2", "UpdateQuote renames a draft",
		renamed.Name == "Acme Q3 — Revised", fmt.Sprintf("name=%q", renamed.Name))

	trimmed, err := client.UpdateQuote(ctx, source.ID, &turbodocx.UpdateQuoteRequest{
		Name: strPtr("  Acme Q3 — Final  ")})
	if err != nil {
		fmt.Printf("Error renaming quote: %v\n", err)
		return 1
	}
	record("S21", "UpdateQuote trims the new name",
		trimmed.Name == "Acme Q3 — Final", fmt.Sprintf("name=%q", trimmed.Name))

	expectRejection("S23a", "whitespace-only name is rejected on update", func() error {
		_, e := client.UpdateQuote(ctx, source.ID, &turbodocx.UpdateQuoteRequest{
			Name: strPtr("   ")})
		return e
	})

	afterRejection, err := client.GetQuote(ctx, source.ID)
	if err != nil {
		fmt.Printf("Error fetching quote: %v\n", err)
		return 1
	}
	record("S23b", "the rejected rename left the stored name untouched",
		afterRejection.Name == "Acme Q3 — Final", fmt.Sprintf("name=%q", afterRejection.Name))

	// --- 5. DUPLICATE NAMING ---
	fmt.Print("\n5. Duplicate naming\n\n")

	copyQuote, err := client.DuplicateQuote(ctx, source.ID)
	if err != nil {
		fmt.Printf("Error duplicating quote: %v\n", err)
		return 1
	}
	createdQuoteIDs = append(createdQuoteIDs, copyQuote.ID)
	record("S3", `DuplicateQuote prefixes the copy with "Copy of "`,
		copyQuote.Name == "Copy of Acme Q3 — Final", fmt.Sprintf("name=%q", copyQuote.Name))

	record("S13", "the copy is built from the CURRENT name, not the name at creation",
		!strings.Contains(copyQuote.Name, "Revised") && strings.Contains(copyQuote.Name, "Final"),
		fmt.Sprintf("source was renamed twice; copy=%q", copyQuote.Name))

	copyOfCopy, err := client.DuplicateQuote(ctx, copyQuote.ID)
	if err != nil {
		fmt.Printf("Error duplicating copy: %v\n", err)
		return 1
	}
	createdQuoteIDs = append(createdQuoteIDs, copyOfCopy.ID)
	record("S30", "duplicating a copy genuinely stacks the prefix (unlike a renewal)",
		copyOfCopy.Name == "Copy of "+copyQuote.Name, fmt.Sprintf("name=%q", copyOfCopy.Name))

	longSource := newQuote(strings.Repeat("C", 255))
	longCopy, err := client.DuplicateQuote(ctx, longSource.ID)
	if err != nil {
		fmt.Printf("Error duplicating long-named quote: %v\n", err)
		return 1
	}
	createdQuoteIDs = append(createdQuoteIDs, longCopy.ID)
	record("S29", "a copy of a 255-char name is truncated to 255, so the insert cannot overflow",
		utf8.RuneCountInString(longCopy.Name) == 255 && strings.HasPrefix(longCopy.Name, "Copy of "),
		fmt.Sprintf("length=%d prefix=%q", utf8.RuneCountInString(longCopy.Name), longCopy.Name[:12]))

	// --- 6. RENAME IS DRAFT-ONLY ---
	fmt.Print("\n6. Rename is draft-only\n\n")

	if os.Getenv("RUN_SEND_CHECKS") == "1" {
		toSend := newQuote("Sent Quote Rename Check")
		if _, sendErr := client.SendQuote(ctx, toSend.ID, nil); sendErr != nil {
			fmt.Printf("Error sending quote: %v\n", sendErr)
			return 1
		}
		expectRejection("S72", "a sent quote refuses a rename", func() error {
			_, e := client.UpdateQuote(ctx, toSend.ID, &turbodocx.UpdateQuoteRequest{
				Name: strPtr("Renamed After Send")})
			return e
		})
	} else {
		skip("S72", "a sent quote refuses a rename",
			"set RUN_SEND_CHECKS=1 with a send-capable org "+
				"(sender name + email on the org quote template)")
	}

	// --- 7. SUMMARY ---
	passed, failed, skipped := 0, 0, 0
	for _, result := range results {
		switch result.outcome {
		case "pass":
			passed++
		case "fail":
			failed++
		case "skip":
			skipped++
		}
	}

	fmt.Printf("\n%s\n", strings.Repeat("=", 60))
	fmt.Printf("  %d passed · %d failed · %d skipped\n", passed, failed, skipped)
	fmt.Printf("%s\n\n", strings.Repeat("=", 60))

	if failed > 0 {
		fmt.Println("Failed rows:")
		for _, result := range results {
			if result.outcome == "fail" {
				fmt.Printf("  %s  %s — %s\n", result.id, result.description, result.detail)
			}
		}
		return 1
	}

	return 0
}
