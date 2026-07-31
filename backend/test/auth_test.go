package tests

import (
	"testing"

	"github.com/jayrsecadron0421/visitor-management/internal/config"
	"github.com/jayrsecadron0421/visitor-management/internal/services"
	"github.com/joho/godotenv"
)

func TestJWTGeneration(t *testing.T) {
	godotenv.Load("../.env.example")
	cfg, _ := config.Load()
	jwt := services.NewJWTService(cfg)
	token, err := jwt.GenerateToken(1, "a@b.com", "user")
	if err != nil {
		t.Fatalf("token generate: %v", err)
	}
	// token should not be empty
	if token == "" {
		t.Fatalf("empty token")
	}
}
