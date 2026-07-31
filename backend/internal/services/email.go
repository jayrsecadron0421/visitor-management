package services

import (
	"fmt"
	"net/smtp"

	"math/rand"
	"time"

	"github.com/jayrsecadron0421/visitor-management/internal/config"
)

func Generate6DigitCode() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

// EmailService interface so can swap implementations.
type EmailService interface {
	Send(to, subject, body string) error
}

// SMTPEmailService - simple SMTP implementation using net/smtp.
type SMTPEmailService struct {
	host     string
	port     int
	username string
	password string
	from     string
}

func NewEmailService(cfg *config.Config) EmailService {
	if cfg.SMTPHost == "" || cfg.SMTPUser == "" {
		// fallback to console logger for dev
		return &ConsoleEmailService{}
	}
	return &SMTPEmailService{
		host:     cfg.SMTPHost,
		port:     cfg.SMTPPort,
		username: cfg.SMTPUser,
		password: cfg.SMTPPass,
		from:     cfg.SMTPUser,
	}
}

func (s *SMTPEmailService) Send(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	auth := smtp.PlainAuth("", s.username, s.password, s.host)
	msg := "From: " + s.from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-version: 1.0;\r\nContent-Type: text/plain; charset=\"UTF-8\";\r\n\r\n" +
		body
	return smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg))
}

// ConsoleEmailService prints email to stdout (dev)
type ConsoleEmailService struct{}

func (c *ConsoleEmailService) Send(to, subject, body string) error {
	fmt.Println("=== EMAIL (console) ===")
	fmt.Println("To:", to)
	fmt.Println("Subject:", subject)
	fmt.Println(body)
	fmt.Println("=======================")
	return nil
}
