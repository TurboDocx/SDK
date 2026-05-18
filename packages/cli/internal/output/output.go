package output

import (
	"encoding/json"
	"fmt"
	"io"
	"text/tabwriter"
)

// KeyValue represents a key-value pair for display
type KeyValue struct {
	Key   string
	Value string
}

// ANSI color codes
const (
	reset  = "\033[0m"
	red    = "\033[31m"
	green  = "\033[32m"
	yellow = "\033[33m"
	bold   = "\033[1m"
)

// Green wraps text in green ANSI color
func Green(s string) string { return green + s + reset }

// Red wraps text in red ANSI color
func Red(s string) string { return red + s + reset }

// Yellow wraps text in yellow ANSI color
func Yellow(s string) string { return yellow + s + reset }

// Bold wraps text in bold ANSI
func Bold(s string) string { return bold + s + reset }

// StatusColor returns a colored status string
func StatusColor(status string) string {
	switch status {
	case "completed", "signed":
		return Green(status)
	case "pending", "in_progress", "waiting":
		return Yellow(status)
	case "voided", "declined", "expired":
		return Red(status)
	default:
		return status
	}
}

// PrintJSON writes indented JSON to the writer
func PrintJSON(w io.Writer, v interface{}) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	_, err = fmt.Fprintln(w, string(data))
	return err
}

// PrintTable writes a formatted table to the writer
func PrintTable(w io.Writer, headers []string, rows [][]string) {
	tw := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)

	// Print headers
	for i, h := range headers {
		if i > 0 {
			fmt.Fprint(tw, "\t")
		}
		fmt.Fprint(tw, h)
	}
	fmt.Fprintln(tw)

	// Print separator
	for i := range headers {
		if i > 0 {
			fmt.Fprint(tw, "\t")
		}
		fmt.Fprint(tw, "---")
	}
	fmt.Fprintln(tw)

	// Print rows
	for _, row := range rows {
		for i, cell := range row {
			if i > 0 {
				fmt.Fprint(tw, "\t")
			}
			fmt.Fprint(tw, cell)
		}
		fmt.Fprintln(tw)
	}

	tw.Flush()
}

// PrintKeyValue writes formatted key-value pairs to the writer
func PrintKeyValue(w io.Writer, pairs []KeyValue) {
	tw := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
	for _, p := range pairs {
		fmt.Fprintf(tw, "%s:\t%s\n", p.Key, p.Value)
	}
	tw.Flush()
}

// PrintError writes an error message to the writer
func PrintError(w io.Writer, msg string) {
	fmt.Fprintf(w, "Error: %s\n", msg)
}

// PrintErrorJSON writes a JSON error to the writer
func PrintErrorJSON(w io.Writer, msg string) {
	data, _ := json.Marshal(map[string]string{"error": msg})
	fmt.Fprintln(w, string(data))
}

// PrintSuccess writes a success message to the writer
func PrintSuccess(w io.Writer, msg string) {
	fmt.Fprintf(w, "Success: %s\n", msg)
}

// MaskKey masks an API key, showing only last 4 characters
func MaskKey(key string) string {
	if len(key) <= 4 {
		return "****"
	}
	return "****" + key[len(key)-4:]
}
