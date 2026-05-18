package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Config holds CLI configuration
type Config struct {
	APIKey        string `json:"apiKey,omitempty"`
	OrgID         string `json:"orgId,omitempty"`
	SenderEmail   string `json:"senderEmail,omitempty"`
	SenderName    string `json:"senderName,omitempty"`
	BaseURL       string `json:"baseUrl,omitempty"`
	PartnerAPIKey string `json:"partnerApiKey,omitempty"`
	PartnerID     string `json:"partnerId,omitempty"`
}

// ValidKeys returns all valid config keys
func ValidKeys() []string {
	return []string{"apiKey", "orgId", "senderEmail", "senderName", "baseUrl", "partnerApiKey", "partnerId"}
}

// Set sets a config field by key name
func (c *Config) Set(key, value string) error {
	switch key {
	case "apiKey":
		c.APIKey = value
	case "orgId":
		c.OrgID = value
	case "senderEmail":
		c.SenderEmail = value
	case "senderName":
		c.SenderName = value
	case "baseUrl":
		c.BaseURL = value
	case "partnerApiKey":
		c.PartnerAPIKey = value
	case "partnerId":
		c.PartnerID = value
	default:
		return fmt.Errorf("unknown config key: %s (valid keys: %v)", key, ValidKeys())
	}
	return nil
}

// Get gets a config field by key name
func (c *Config) Get(key string) (string, error) {
	switch key {
	case "apiKey":
		return c.APIKey, nil
	case "orgId":
		return c.OrgID, nil
	case "senderEmail":
		return c.SenderEmail, nil
	case "senderName":
		return c.SenderName, nil
	case "baseUrl":
		return c.BaseURL, nil
	case "partnerApiKey":
		return c.PartnerAPIKey, nil
	case "partnerId":
		return c.PartnerID, nil
	default:
		return "", fmt.Errorf("unknown config key: %s (valid keys: %v)", key, ValidKeys())
	}
}

// DefaultPath returns the default config file path
func DefaultPath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		home = "."
	}
	return filepath.Join(home, ".turbodocx", "config.json")
}

// Load reads config from the given path. Returns zero config if file doesn't exist.
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &Config{}, nil
		}
		return nil, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}
	return &cfg, nil
}

// Save writes config to the given path with secure permissions
func Save(path string, cfg *Config) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}
	return nil
}
