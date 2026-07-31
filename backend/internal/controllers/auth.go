package controllers

import (
	"errors"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/config"
	"github.com/jayrsecadron0421/visitor-management/internal/models"
	"github.com/jayrsecadron0421/visitor-management/internal/services"
)

// DTOs
type registerRequest struct {
	FullName        string `json:"full_name" binding:"required"`
	Email           string `json:"email" binding:"required"`
	PhoneNumber     string `json:"phone_number" binding:"required"`
	Birthday        string `json:"birthday" binding:"required"` // YYYY-MM-DD
	Password        string `json:"password" binding:"required"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type forgotRequest struct {
	Email string `json:"email" binding:"required"`
}

type resetRequest struct {
	Email           string `json:"email" binding:"required"`
	Code            string `json:"code" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

type AuthController struct {
	db    *gorm.DB
	jwt   *services.JWTService
	email services.EmailService
	cfg   *config.Config
}

func NewAuthController(db *gorm.DB, jwt *services.JWTService, email services.EmailService, cfg *config.Config) *AuthController {
	return &AuthController{db: db, jwt: jwt, email: email, cfg: cfg}
}

// Register creates a new user (role default to "user")
func (a *AuthController) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "passwords do not match"})
		return
	}

	// simple password policy
	if len(req.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 8 characters"})
		return
	}
	if !regexp.MustCompile(`[0-9]`).MatchString(req.Password) || !regexp.MustCompile(`[^a-zA-Z0-9]`).MatchString(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must include at least one number and one symbol"})
		return
	}

	// parse birthday
	bd, err := time.Parse("2006-01-02", req.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "birthday must be YYYY-MM-DD"})
		return
	}

	// check uniqueness
	var exists int64
	a.db.Model(&models.User{}).Where("email = ?", req.Email).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email already registered"})
		return
	}

	pwHash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	user := models.User{
		FullName:     req.FullName,
		Email:        req.Email,
		PhoneNumber:  req.PhoneNumber,
		Birthday:     bd,
		PasswordHash: string(pwHash),
		Role:         "user",
		IsActive:     true,
	}
	if err := a.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "user created", "user_id": user.ID})
}

func (a *AuthController) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	var user models.User
	if err := a.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	token, err := a.jwt.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": token, "token_type": "bearer", "expires_in": a.cfg.JWTExpiry})
}

// ForgotPassword -> create 6-digit code, send via email
func (a *AuthController) ForgotPassword(c *gin.Context) {
	var req forgotRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
		return
	}

	// 1️⃣ Check if user exists
	var user models.User
	if err := a.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "email not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "database error",
		})
		return
	}

	// 2️⃣ Generate reset code
	code := services.Generate6DigitCode()

	reset := models.PasswordResetCode{
		Email:     req.Email,
		Code:      code,
		ExpiresAt: time.Now().Add(15 * time.Minute),
		Used:      false,
	}

	if err := a.db.Create(&reset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "could not create reset code",
		})
		return
	}

	// 3️⃣ Send email
	body := "Your password reset code is: " + code
	if err := a.email.Send(req.Email, "Password Reset Code", body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to send email",
		})
		return
	}

	// 4️⃣ Success
	c.JSON(http.StatusOK, gin.H{
		"message": "reset code sent to your email",
	})
}

func (a *AuthController) ResetPassword(c *gin.Context) {
	var req resetRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "passwords do not match"})
		return
	}
	// policy check
	if len(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 8 characters"})
		return
	}
	var code models.PasswordResetCode
	if err := a.db.Where("email = ? AND code = ? AND used = false", req.Email, req.Code).First(&code).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid code"})
		return
	}
	if time.Now().After(code.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code expired"})
		return
	}

	// update user password
	var user models.User
	if err := a.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	user.PasswordHash = string(hash)
	a.db.Save(&user)

	// mark code used
	code.Used = true
	a.db.Save(&code)

	c.JSON(http.StatusOK, gin.H{"message": "password reset successful"})
}

func (a *AuthController) Me(c *gin.Context) {
	uid, _ := c.Get("user_id")
	var user models.User
	if err := a.db.First(&user, uid).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}
	// return profile excluding password
	c.JSON(http.StatusOK, gin.H{
		"id":           user.ID,
		"full_name":    user.FullName,
		"email":        user.Email,
		"phone_number": user.PhoneNumber,
		"birthday":     user.Birthday.Format("2006-01-02"),
		"role":         user.Role,
		"is_active":    user.IsActive,
	})
}
