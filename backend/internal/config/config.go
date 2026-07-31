package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	DBHost                string
	DBPort                int
	DBUser                string
	DBPassword            string
	DBName                string
	AppPort               int
	JWTSecret             string
	JWTExpiry             int // minutes
	SMTPHost              string
	SMTPPort              int
	SMTPUser              string
	SMTPPass              string
	AdminEmail            string
	AdminPass             string
	AlertThresholdMinutes int
	RateLimitForgot       int
}

func Load() (*Config, error) {
	get := func(key, fallback string) string {
		v := os.Getenv(key)
		if v == "" {
			return fallback
		}
		return v
	}

	dbPort, _ := strconv.Atoi(get("DB_PORT", "5432"))
	portStr := get("PORT", get("APP_PORT", "8080"))
	appPort, _ := strconv.Atoi(portStr)
	jwtExp, _ := strconv.Atoi(get("JWT_EXPIRY_MIN", "60"))
	smtpPort, _ := strconv.Atoi(get("SMTP_PORT", "587"))
	alertThreshold, _ := strconv.Atoi(get("ALERT_THRESHOLD_MINUTES", "240"))
	rateLimitForgot, _ := strconv.Atoi(get("RATE_LIMIT_FORGOT", "5"))

	cfg := &Config{
		DBHost:                get("DB_HOST", "127.0.0.1"),
		DBPort:                dbPort,
		DBUser:                get("DB_USER", "postgres"),
		DBPassword:            get("DB_PASSWORD", ""),
		DBName:                get("DB_NAME", "visitordb"),
		AppPort:               appPort,
		JWTSecret:             get("JWT_SECRET", "a13e2f47d4e9c43418fdcbb6e66727dc3d40b3549d03f5e540c9fce75f116c74"),
		JWTExpiry:             jwtExp,
		SMTPHost:              get("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:              smtpPort,
		SMTPUser:              get("SMTP_USER", "testd0421@gmail.com"),
		SMTPPass:              get("SMTP_PASS", "vnazyrdbocmflftq"),
		AdminEmail:            get("ADMIN_EMAIL", "admin@example.com"),
		AdminPass:             get("ADMIN_PASSWORD", "Admin@12345"), // DEV only
		AlertThresholdMinutes: alertThreshold,
		RateLimitForgot:       rateLimitForgot,
	}

	if cfg.JWTSecret == "" {
		return nil, errors.New("JWT_SECRET required")
	}

	return cfg, nil
}

func (c *Config) PostgresDSN() string {
	// If Railway provides DATABASE_URL, use it
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		return dbURL + "?sslmode=require"
	}

	// Otherwise use local config
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName,
	)
}
