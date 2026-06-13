package turbodocx

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"
)

// ClientContext describes the calling environment for the signature audit
// trail. The SDK auto-detects a descriptive User-Agent, timezone, language, and
// device fingerprint from the host; set these fields to override them or to
// report a client IP (IPAddress) so the audit trail can geolocate the caller.
//
// The TurboDocx backend derives the audit trail's device + location from the
// request's User-Agent, X-Timezone, Accept-Language, X-Forwarded-For and
// X-Device-Fingerprint headers, and only classifies a request as an SDK call
// when the User-Agent starts with the canonical "@turbodocx/sdk/<version>"
// token (which the auto-generated User-Agent always uses).
type ClientContext struct {
	// UserAgent overrides the auto-generated descriptive User-Agent.
	UserAgent string

	// IPAddress is the client IP to report as X-Forwarded-For to drive
	// geolocation. Opt-in: omitted by default so a container's private IP never
	// overrides the production load balancer's real public IP (X-Forwarded-For
	// is leftmost-wins).
	IPAddress string

	// Timezone overrides the auto-detected timezone (sent as X-Timezone).
	Timezone string

	// Language overrides the auto-detected BCP-47 language tag (Accept-Language).
	Language string

	// DeviceFingerprint overrides the auto-generated device fingerprint.
	DeviceFingerprint string
}

// buildDefaultUserAgent builds a descriptive SDK User-Agent from the host
// environment, e.g.
// "@turbodocx/sdk/0.4.0 (Go/go1.24.5; linux; amd64; host=svc-1)".
func buildDefaultUserAgent() string {
	base := fmt.Sprintf("@turbodocx/sdk/%s", Version)
	host, err := os.Hostname()
	if err != nil || host == "" {
		return base
	}
	return fmt.Sprintf("%s (Go/%s; %s; %s; host=%s)", base, runtime.Version(), runtime.GOOS, runtime.GOARCH, host)
}

// detectTimezone detects the host timezone name (e.g. "UTC"); "" if unavailable.
func detectTimezone() string {
	name, _ := time.Now().Zone()
	return name
}

// detectLocale detects the host BCP-47 language tag (e.g. "en-US") from the
// environment; "" if unavailable or a non-language locale (C/POSIX).
func detectLocale() string {
	raw := os.Getenv("LC_ALL")
	if raw == "" {
		raw = os.Getenv("LC_MESSAGES")
	}
	if raw == "" {
		raw = os.Getenv("LANG")
	}
	if raw == "" {
		return ""
	}
	// Strip encoding suffix ("en_US.UTF-8" -> "en_US") and normalize.
	tag := strings.ReplaceAll(strings.Split(raw, ".")[0], "_", "-")
	tag = strings.TrimSpace(tag)
	switch strings.ToUpper(tag) {
	case "", "C", "POSIX":
		return ""
	}
	return tag
}

// buildDeviceFingerprint returns a stable, non-reversible fingerprint of the
// host (hostname/GOOS/GOARCH); "" if unavailable.
func buildDeviceFingerprint() string {
	host, err := os.Hostname()
	if err != nil || host == "" {
		return ""
	}
	seed := strings.Join([]string{host, runtime.GOOS, runtime.GOARCH}, "|")
	sum := sha256.Sum256([]byte(seed))
	return hex.EncodeToString(sum[:])
}

// resolveClientContextHeaders resolves the effective client-context request
// headers, applying caller overrides over auto-detected host values.
func resolveClientContextHeaders(ctx ClientContext) map[string]string {
	headers := map[string]string{}

	if ctx.UserAgent != "" {
		headers["User-Agent"] = ctx.UserAgent
	} else {
		headers["User-Agent"] = buildDefaultUserAgent()
	}

	timezone := ctx.Timezone
	if timezone == "" {
		timezone = detectTimezone()
	}
	if timezone != "" {
		headers["X-Timezone"] = timezone
	}

	language := ctx.Language
	if language == "" {
		language = detectLocale()
	}
	if language != "" {
		headers["Accept-Language"] = language
	}

	fingerprint := ctx.DeviceFingerprint
	if fingerprint == "" {
		fingerprint = buildDeviceFingerprint()
	}
	if fingerprint != "" {
		headers["X-Device-Fingerprint"] = fingerprint
	}

	// Opt-in only (see ClientContext.IPAddress).
	if ctx.IPAddress != "" {
		headers["X-Forwarded-For"] = ctx.IPAddress
	}

	return headers
}
