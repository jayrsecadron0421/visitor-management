package services

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jayrsecadron0421/visitor-management/internal/config"
)

type JWTService struct {
	secret        string
	expiryMinutes int
}

func NewJWTService(cfg *config.Config) *JWTService {
	return &JWTService{secret: cfg.JWTSecret, expiryMinutes: cfg.JWTExpiry}
}

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (s *JWTService) Secret() string { return s.secret }

func (s *JWTService) GenerateToken(userID uint, email, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.expiryMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "visitor-management",
			Subject:   "access_token",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}
